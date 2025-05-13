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

export default function ChatDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
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
    
    // Chỉ xử lý tin nhắn liên quan đến cuộc trò chuyện hiện tại
    if (
      (message.senderId === receiverId && message.receiverId === Number(user.id)) ||
      (message.receiverId === receiverId && message.senderId === Number(user.id))
    ) {
      // Thêm tin nhắn mới vào danh sách
      setMessages((prev) => {
        // Kiểm tra nếu tin nhắn đã tồn tại
        const messageExists = prev.some(msg => msg.id === message.id);
        if (messageExists) return prev;

        // Add new message to the end (in chronological order)
        return [...prev, processMessage(message)];
      });

      // Đánh dấu tin nhắn là đã đọc nếu người dùng là người nhận
      if (message.receiverId === Number(user.id) && !message.isRead) {
        markAsReadLocally(message.senderId);
      }
    }
  }, [user?.id, receiverId, processMessage]);

  // Đánh dấu tin nhắn đã đọc cục bộ và gửi lên server
  const markAsReadLocally = useCallback((senderId: number) => {
    if (!user?.id) return;

    // Cập nhật UI trước
    setMessages(prev => prev.map(msg => 
      msg.senderId === senderId && msg.receiverId === Number(user.id) && !msg.isRead
        ? { ...msg, isRead: true }
        : msg
    ));
    
    // Gửi yêu cầu đánh dấu đã đọc
    try {
      messageSocketInstance.markAsRead(senderId);
    } catch (error) {
      console.error('Error marking messages as read via socket:', error);
      // Fallback to API if needed
      messagesService.markAsRead(senderId).catch(err => 
        console.error('Error marking messages as read:', err)
      );
    }
  }, [user?.id]);

  // Modify fetchMessages to process each message and scroll to latest message
  const fetchMessages = useCallback(
    async (showLoader = true) => {
      if (receiverId <= 0) {
        setError("Invalid recipient");
        setLoading(false);
        return;
      }

      try {
        if (showLoader && isMounted.current) setLoading(true);
        setError(null);

        const response = await messagesService.getMessages({
          receiverId: receiverId,
          limit: 50,
        });

        if (isMounted.current) {
          if (response.data.length > 0) {
            // Display messages in chronological order (oldest to newest)
            const messagesInOrder = response.data;
            
            // Process each message to extract photo URLs
            const processedMessages = messagesInOrder.map(processMessage);
            setMessages(processedMessages);

            // Mark messages as read
            const unreadMessages = messagesInOrder.filter(
              msg => msg.senderId === receiverId && msg.receiverId === Number(user?.id) && !msg.isRead
            );
            
            if (unreadMessages.length > 0) {
              markAsReadLocally(receiverId);
            }

            // Extract friend details from first message
            const firstMessage = response.data[0];
            if (firstMessage && user) {
              const otherUser =
                firstMessage.senderId === Number(user.id)
                  ? firstMessage.receiver
                  : firstMessage.sender;

              if (otherUser) {
                setFriendDetails({
                  name: `${otherUser.firstName} ${otherUser.lastName}`,
                  avatar: otherUser.photo,
                });
              }
            }
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        if (isMounted.current) {
          setError("Unable to load messages. Pull down to retry.");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [receiverId, user?.id, processMessage, markAsReadLocally]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMessages(false);
  }, [fetchMessages]);

  useEffect(() => {
    isMounted.current = true;
    fetchMessages();

    // Connect to WebSocket
    if (user?.id) {
      messageSocketInstance.connect(Number(user.id));
      
      // Listen for new messages
      const unsubscribeNewMessage = messageSocketInstance.onNewMessage(handleNewMessage);
      
      // Listen for read receipts
      const unsubscribeMessagesRead = messageSocketInstance.onMessagesRead(data => {
        if (data.by === receiverId) {
          // Update read status of messages sent to this recipient
          setMessages(prev => prev.map(msg => 
            msg.senderId === Number(user.id) && msg.receiverId === receiverId 
              ? { ...msg, isRead: true } 
              : msg
          ));
        }
      });
      
      return () => {
        isMounted.current = false;
        unsubscribeNewMessage();
        unsubscribeMessagesRead();
      };
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchMessages, user?.id, handleNewMessage, receiverId]);

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

    // Add to messages list immediately (optimistic update)
    setMessages((prev) => [...prev, processMessage(optimisticMessage)]);

    // Scroll to the bottom after adding the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Try to send via WebSocket first
      messageSocketInstance.sendMessage({
        receiverId: receiverId,
        content: trimmedMessage,
      });
      
      // Also send via API as fallback
      const sentMessage = await messagesService.sendMessage({
        receiverId: receiverId,
        content: trimmedMessage,
      });

      // Replace optimistic message with actual message from server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.clientId === tempClientId ? processMessage(sentMessage) : msg
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

  return (
    <SafeAreaView style={chatStyles.container}>
      <StatusBar style="light" />
      <View style={chatStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={chatStyles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>

        <View style={chatStyles.userInfoContainer}>
          {friendDetails.avatar ? (
            <Image
              source={{ uri: friendDetails.avatar }}
              style={chatStyles.avatar}
              cachePolicy="memory"
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
            {isTyping && <Text style={chatStyles.typingText}>Typing...</Text>}
          </View>
        </View>

        <View style={chatStyles.headerIconsContainer}>
          <TouchableOpacity style={chatStyles.headerIcon}>
            <Ionicons name="call-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={chatStyles.contentContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.clientId || item.id}
            contentContainerStyle={[
              chatStyles.flatListContent,
              messages.length === 0 && chatStyles.emptyListContent,
            ]}
            ListHeaderComponent={messages.length > 0 ? renderTimeHeader : null}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFC83C"
                colors={["#FFC83C"]}
              />
            }
            showsVerticalScrollIndicator={true}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
            inverted={false}
            onContentSizeChange={() => {
              if (messages.length > 0 && !refreshing) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />
        </View>

        <View style={chatStyles.inputContainer}>
          <View style={chatStyles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={chatStyles.textInput}
              placeholder="Send message..."
              placeholderTextColor="#999"
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
            />
            <TouchableOpacity style={chatStyles.sendButton} onPress={sendMessage}>
              <Ionicons
                name="send"
                size={22}
                color={inputMessage.trim() ? "#FFC83C" : "#666"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}