import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import messagesService, { MessageDto, messageSocketInstance } from "@/lib/services/messages";
import { format } from "date-fns";
import { useAuthStore } from "@/lib/stores/auth-store";
import filesService from "@/lib/services/files";
import { FontAwesome } from "@expo/vector-icons";
import { chatStyles } from "./styles/chatStyles";

// Extended MessageDto type that can include a client-side ID for optimistic updates
type MessageWithClientId = MessageDto & {
  clientId?: string;
  extractedPhotoUrl?: string;
  extractedContent?: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MESSAGE_IMAGE_SIZE = SCREEN_WIDTH * 0.65;

// Memoized Message component for better performance
const MessageItem = memo(({ 
  message, 
  isUserMessage, 
  formatTimestamp,
  userId,
  friendName,
  friendAvatar,
}: { 
  message: MessageWithClientId, 
  isUserMessage: boolean,
  formatTimestamp: (date: string) => string,
  userId: number,
  friendName: string,
  friendAvatar?: string,
}) => {
  // Check if message contains a photo
  if (message.extractedPhotoUrl) {
    return (
      <>
        <View style={chatStyles.centeredImageContainer}>
          <Image
            source={{ uri: message.extractedPhotoUrl }}
            style={chatStyles.centeredImage}
            transition={300}
            contentFit="cover"
            cachePolicy="memory"
          />
          {!isUserMessage && (
            <View style={chatStyles.photoUserBadge}>
              <Text style={chatStyles.photoUserText}>{friendName}</Text>
            </View>
          )}
        </View>
        
        {message.extractedContent && (
          <View style={[
            chatStyles.messageContainer,
            isUserMessage ? chatStyles.userMessageContainer : chatStyles.otherMessageContainer
          ]}>
            <Text style={[
              chatStyles.messageText,
              !isUserMessage && chatStyles.otherMessageText
            ]}>{message.extractedContent}</Text>
            
            <Text style={[
              chatStyles.timestampText,
              !isUserMessage && { color: '#999' }
            ]}>
              {formatTimestamp(message.createdAt)}
              {isUserMessage && message.isRead && <Text style={chatStyles.readText}> • Read</Text>}
            </Text>
          </View>
        )}
      </>
    );
  }
  
  // Regular text message
  return (
    <View style={[
      chatStyles.messageContainer,
      isUserMessage ? chatStyles.userMessageContainer : chatStyles.otherMessageContainer
    ]}>
      <Text style={[
        chatStyles.messageText,
        !isUserMessage && chatStyles.otherMessageText
      ]}>{message.content}</Text>

      <Text style={[
        chatStyles.timestampText,
        !isUserMessage && { color: '#999' }
      ]}>
        {formatTimestamp(message.createdAt)}
        {isUserMessage && message.isRead && <Text style={chatStyles.readText}> • Read</Text>}
      </Text>
    </View>
  );
}, (prevProps, nextProps) => {
  // Optimize re-render only when necessary
  return prevProps.message.id === nextProps.message.id && 
    prevProps.message.isRead === nextProps.message.isRead &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isUserMessage === nextProps.isUserMessage;
});

// Component hiển thị trạng thái kết nối
const ConnectionStatus = memo(({ isConnected, isConnecting }: { isConnected: boolean, isConnecting: boolean }) => {
  if (isConnected) return null;

  return (
    <View style={chatStyles.connectionStatusContainer}>
      <View style={[
        chatStyles.connectionStatusDot,
        isConnecting ? chatStyles.connectingDot : chatStyles.disconnectedDot
      ]} />
      <Text style={chatStyles.connectionStatusText}>
        {isConnecting ? "Connecting..." : "No connection"}
      </Text>
    </View>
  );
});

export default function ChatDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const isMounted = useRef(true);

  // Safely parse the ID to a number
  const receiverId = React.useMemo(() => {
    try {
      if (!id) return 0;
      const parsed = parseInt(id, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      return 0;
    }
  }, [id]);

  const [messages, setMessages] = useState<MessageWithClientId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [friendDetails, setFriendDetails] = useState<{
    name: string;
    avatar?: string;
  }>({ name: "Chat", avatar: undefined });
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketConnecting, setSocketConnecting] = useState(false);

  // Function to mark messages as read locally
  const markAsReadLocally = useCallback(async () => {
    if (!user?.id || receiverId <= 0) return;

    try {
      // Đánh dấu tin nhắn đã đọc trên server
      await messageSocketInstance.markAsRead(receiverId);
      
      // Cập nhật UI
      setMessages(prev => prev.map(msg => 
        msg.senderId === receiverId ? { ...msg, isRead: true } : msg
      ));
    } catch (err) {
      console.error('Error marking messages as read:', err);
      // Fallback to REST API if WebSocket fails
      try {
        await messagesService.markAsRead(receiverId);
        // Update locally
        setMessages(prev => prev.map(msg => 
          msg.senderId === receiverId ? { ...msg, isRead: true } : msg
        ));
      } catch (restErr) {
        console.error('Failed to mark messages as read via REST API:', restErr);
      }
    }
  }, [receiverId, user?.id]);

  // Add a function to process messages and extract photo URLs
  const processMessage = useCallback((
    message: MessageWithClientId
  ): MessageWithClientId => {
    // Check if the message content matches the photo pattern
    // Enhanced regex that can handle more complex URLs including IPFS links
    const photoRegex = /\[Photo:\s*(https?:\/\/[^\]]+)\]\s*(.*)/;
    const match = message.content ? message.content.match(photoRegex) : null;

    if (match && match.length >= 3) {
      const photoUrl = match[1].trim();
      const textContent = match[2].trim();

      return {
        ...message,
        extractedPhotoUrl: photoUrl,
        extractedContent: textContent || "",
      };
    }

    return message;
  }, []);

  // Xử lý khi nhận được tin nhắn mới qua WebSocket
  const handleNewMessage = useCallback((message: MessageDto) => {
    if (!user?.id) return;
    
    console.log("New message received via WebSocket:", message);
    
    // Process the message similar to the rest
    const processedMessage = processMessage(message);
    
    // Add to messages array and scroll
    setMessages((prev) => {
      // Check if we already have this message (avoid duplicates)
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      
      // Add new message at the end (we display oldest first)
      return [...prev, processedMessage];
    });
    
    // Mark as read if it's from the other user
    if (message.senderId === receiverId) {
      markAsReadLocally();
    }
    
    // Scroll to the bottom to show the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [user?.id, receiverId, processMessage, markAsReadLocally]);

  // Xử lý khi người khác đang typing
  const handleUserTyping = useCallback((status: { userId: number, isTyping: boolean }) => {
    if (status.userId === receiverId) {
      setOtherUserIsTyping(status.isTyping);
    }
  }, [receiverId]);

  // Effect xử lý trạng thái kết nối WebSocket
  useEffect(() => {
    const handleConnectionStatus = (status: boolean) => {
      setSocketConnected(status);
      setSocketConnecting(false);
    };

    const unsubscribe = messageSocketInstance.onConnectionStatus((status) => {
      handleConnectionStatus(status);
    });

    // Check websocket connection status
    if (!messageSocketInstance.isConnected()) {
      setSocketConnecting(messageSocketInstance.isConnecting());
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    if (!user?.id || !token || receiverId <= 0) return;
    
    // Connect to WebSocket
    messageSocketInstance.connect(Number(user.id), token);
    
    // Subscribe to events
    const unsubscribeNewMessage = messageSocketInstance.onNewMessage(message => {
      if (!user?.id) return;
      
      // Only handle messages related to this conversation
      if (
        (message.senderId === receiverId && message.receiverId === Number(user.id)) ||
        (message.receiverId === receiverId && message.senderId === Number(user.id))
      ) {
        console.log("New message received via WebSocket:", message);
        
        // Process the message similar to the rest
        const processedMessage = processMessage(message);
        
        // Add to messages array and scroll
        setMessages((prev) => {
          // Check if we already have this message (avoid duplicates)
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) return prev;
          
          // Add new message at the end (we display oldest first)
          return [...prev, processedMessage];
        });
        
        // Mark as read if it's from the other user
        if (message.senderId === receiverId) {
          markAsReadLocally();
        }
        
        // Scroll to the bottom to show the new message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });
    
    // Xử lý typing events
    const unsubscribeTyping = messageSocketInstance.onUserTyping(status => {
      handleUserTyping(status);
    });

    // Xử lý lỗi
    const unsubscribeError = messageSocketInstance.onError(error => {
      console.error('WebSocket error:', error);
    });

    // Xử lý khi có tin nhắn được đánh dấu đã đọc
    const unsubscribeRead = messageSocketInstance.onMessagesRead(data => {
      if (data.by === receiverId) {
        setMessages(prev => prev.map(msg => 
          msg.senderId === Number(user.id) ? { ...msg, isRead: true } : msg
        ));
      }
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeTyping();
      unsubscribeError();
      unsubscribeRead();
    };
  }, [user?.id, token, receiverId, handleUserTyping]);

  // Fetch messages from the server
  const fetchMessages = useCallback(async (showLoader = true) => {
    if (!user?.id || receiverId <= 0) {
      setLoading(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch messages between current user and receiver
      const response = await messagesService.getMessages({
        receiverId: receiverId,
        limit: 50,
      });

      // Process and populate all messages 
      // Reverse the order since backend now returns DESC (newest first)
      // but we want to display oldest first in the UI
      const processedMessages = response.data.map(processMessage).reverse();
      
      setMessages(processedMessages);
      
      // Mark messages as read if there are unread messages
      const hasUnreadMessages = processedMessages.some(
        msg => !msg.isRead && msg.senderId === receiverId
      );
      
      if (hasUnreadMessages) {
        markAsReadLocally();
      }

      // Fetch friend details if available
      if (processedMessages.length > 0) {
        const friendMessage = processedMessages.find(
          msg => msg.senderId === receiverId || msg.receiverId === receiverId
        );
        
        if (friendMessage) {
          const friend = friendMessage.senderId === Number(user.id) 
            ? friendMessage.receiver 
            : friendMessage.sender;
            
          if (friend) {
            setFriendDetails({
              name: `${friend.firstName} ${friend.lastName}`,
              avatar: friend.photo,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Could not load messages. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, receiverId, processMessage, markAsReadLocally]);

  // Load messages when component mounts
  useEffect(() => {
    if (user?.id && receiverId > 0) {
      fetchMessages();
    }

    return () => {
      isMounted.current = false;
    };
  }, [fetchMessages, user?.id, token, receiverId, handleUserTyping, isTyping, markAsReadLocally]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending || !user || receiverId <= 0) {
      return;
    }

    const trimmedMessage = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    // Make sure the input stays focused after sending
    inputRef.current?.focus();

    // Generate a temporary client ID for optimistic updates
    const tempClientId = `temp-${Date.now()}`;

    // Create optimistic message
    const optimisticMessage: MessageWithClientId = {
      id: tempClientId,
      clientId: tempClientId,
      content: trimmedMessage,
      senderId: Number(user.id),
      receiverId: receiverId,
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("optimisticMessage", optimisticMessage);

    // Add to messages list immediately (optimistic update)
    // Add new message to the end since we display oldest first
    setMessages((prev) => [...prev, processMessage(optimisticMessage)]);

    // Scroll to the bottom after adding the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      let messageResponse;
      
      // Kiểm tra kết nối WebSocket trước khi gửi
      if (socketConnected) {
        try {
          // Thử gửi qua WebSocket trước
          messageResponse = await messageSocketInstance.sendMessage({
            receiverId: receiverId,
            content: trimmedMessage,
          });
        } catch (socketErr) {
          console.error("WebSocket send failed, falling back to REST API:", socketErr);
          // Nếu WebSocket thất bại, dùng REST API
          messageResponse = await messagesService.sendMessage({
            receiverId: receiverId,
            content: trimmedMessage,
          });
        }
      } else {
        // Sử dụng REST API nếu không có kết nối WebSocket
        messageResponse = await messagesService.sendMessage({
          receiverId: receiverId,
          content: trimmedMessage,
        });
      }
      
      // Replace optimistic message with actual message from server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.clientId === tempClientId ? processMessage(messageResponse) : msg
        )
      );
    } catch (err) {
      console.error("Error sending message:", err);

      // Show error
      Alert.alert(
        "Message Not Sent",
        "Your message could not be sent. Please try again.",
        [{ text: "OK" }]
      );

      // Remove optimistic message
      setMessages((prev) =>
        prev.filter((msg) => msg.clientId !== tempClientId)
      );
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (err) {
      return "";
    }
  };

  const formatHeaderTime = (dateString?: string) => {
    if (!dateString) return "";

    try {
      return format(new Date(dateString), "d MMM h:mm a");
    } catch (err) {
      return "";
    }
  };

  const renderTimeHeader = () => {
    if (!messages[0]?.createdAt) return null;
    
    return (
      <View style={chatStyles.timeHeaderContainer}>
        <Text style={chatStyles.timeHeaderText}>
          {formatHeaderTime(messages[0]?.createdAt)}
        </Text>
      </View>
    );
  };

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={chatStyles.emptyContainer}>
          <ActivityIndicator size="large" color="#FFC83C" />
          <Text style={chatStyles.emptyText}>Loading conversation...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={chatStyles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FFC83C" />
          <Text style={chatStyles.emptyText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={chatStyles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={40} color="#FFC83C" />
        <Text style={chatStyles.emptyText}>No messages yet</Text>
        <Text style={chatStyles.emptySubtext}>
          Start your conversation with {friendDetails.name}
        </Text>
      </View>
    );
  };

  // Memoized render item function
  const renderItem = useCallback(({ item }: { item: MessageWithClientId }) => {
    if (!user) return null;
    const isUserMessage = item.senderId === Number(user.id);

    return (
      <MessageItem 
        message={item}
        isUserMessage={isUserMessage}
        formatTimestamp={formatTimestamp}
        userId={Number(user.id)}
        friendName={friendDetails.name}
        friendAvatar={friendDetails.avatar}
      />
    );
  }, [user, friendDetails]);

  // Effect to scroll to the bottom when new message arrives
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Add Keyboard event listeners to improve UX
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (messages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages.length]);

  const getInitials = (name: string) => {
    if (!name) return 'CQ';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };

  // Xử lý khi người dùng đang typing
  const handleInputChange = (text: string) => {
    setInputMessage(text);
    
    // Nếu người dùng đang nhập, gửi trạng thái typing
    if (receiverId) {
      // Xóa timeout cũ nếu có
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Chỉ gửi trạng thái typing nếu chưa được gửi và có kết nối WebSocket
      if (!isTyping && socketConnected) {
        setIsTyping(true);
        messageSocketInstance.sendTypingStatus(receiverId, true);
      }
      
      // Tự động reset trạng thái typing sau 3 giây
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping && socketConnected) {
          setIsTyping(false);
          messageSocketInstance.sendTypingStatus(receiverId, false);
        }
      }, 3000);
    }
  };

  const renderTypingIndicator = () => {
    if (!otherUserIsTyping) return null;
    
    return (
      <View style={{ padding: 6, alignSelf: 'flex-start' }}>
        <Text style={chatStyles.typingText}>
          {friendDetails.name} is typing...
        </Text>
      </View>
    );
  };

  // Render the header
  const renderHeader = useCallback(() => {
    return (
      <View style={chatStyles.headerContainer}>
        <TouchableOpacity 
          style={chatStyles.backButton} 
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={chatStyles.userInfoContainer}>
          {friendDetails.avatar ? (
            <Image
              source={{ uri: friendDetails.avatar }}
              style={chatStyles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={chatStyles.initialsContainer}>
              <Text style={chatStyles.initialsText}>
                {getInitials(friendDetails.name)}
              </Text>
            </View>
          )}
          
          <View>
            <Text style={chatStyles.nameText}>{friendDetails.name}</Text>
            {otherUserIsTyping && (
              <Text style={chatStyles.typingText}>typing...</Text>
            )}
          </View>
        </View>
        
        <View style={chatStyles.headerIconsContainer}>
          <TouchableOpacity style={chatStyles.headerIcon}>
            <FontAwesome name="video-camera" size={20} color="#FFC83C" />
          </TouchableOpacity>
          <TouchableOpacity style={chatStyles.headerIcon}>
            <Ionicons name="call" size={20} color="#FFC83C" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [router, friendDetails, otherUserIsTyping]);

  return (
    <SafeAreaView style={chatStyles.container}>
      <StatusBar style="light" />
      
      {/* Connection status indicator */}
      <ConnectionStatus 
        isConnected={socketConnected} 
        isConnecting={socketConnecting} 
      />
      
      {renderHeader()}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={chatStyles.keyboardAvoidView}
      >
        <View style={chatStyles.contentContainer}>
          {messages.length === 0 ? (
            renderEmptyList()
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.clientId || item.id}
              contentContainerStyle={chatStyles.flatListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={fetchMessages}
                  tintColor="#FFC83C"
                  colors={["#FFC83C"]}
                />
              }
              ListHeaderComponent={renderTimeHeader}
              ListFooterComponent={renderTypingIndicator}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              onEndReachedThreshold={0.1}
              // Display messages from oldest to newest (bottom = newest)
              inverted={false}
            />
          )}
        </View>

        <View style={chatStyles.inputContainer}>
          <View style={chatStyles.inputWrapper}>
            <TouchableOpacity>
              <AntDesign name="picture" size={22} color="#FFC83C" style={{ marginRight: 10 }} />
            </TouchableOpacity>
            
            <TextInput
              ref={inputRef}
              style={chatStyles.textInput}
              value={inputMessage}
              onChangeText={handleInputChange}
              placeholder="Type your message..."
              placeholderTextColor="#888"
              multiline
              maxLength={1000}
              autoCapitalize="sentences"
            />
            
            <TouchableOpacity 
              style={chatStyles.sendButton}
              onPress={sendMessage}
              disabled={!inputMessage.trim() || sending}
            >
              <Ionicons 
                name="send" 
                size={22} 
                color={!inputMessage.trim() || sending ? "#888" : "#FFC83C"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}