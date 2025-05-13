import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback, useRef, memo } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "expo-image"
import messagesService, { ConversationItem, messageSocketInstance, MessageDto } from '@/lib/services/messages'
import { useAuthStore } from '@/lib/stores/auth-store'
import { formatDistanceToNow } from 'date-fns'
import chatListStyles from './styles/chatListStyles'

// Extend ConversationItem để thêm trạng thái typing
interface EnhancedConversationItem extends ConversationItem {
  isTyping?: boolean;
}

// Component hiển thị trạng thái kết nối
const ConnectionStatus = memo(({ isConnected, isConnecting }: { isConnected: boolean, isConnecting: boolean }) => {
  if (isConnected) return null;

  return (
    <View style={chatListStyles.connectionStatusContainer}>
      <View style={[
        chatListStyles.connectionStatusDot,
        isConnecting ? chatListStyles.connectingDot : chatListStyles.disconnectedDot
      ]} />
      <Text style={chatListStyles.connectionStatusText}>
        {isConnecting ? "Connecting..." : "No connection"}
      </Text>
    </View>
  );
});

export default function Chat() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [conversations, setConversations] = useState<EnhancedConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [socketConnecting, setSocketConnecting] = useState(false)
  const isMounted = useRef(true)
  
  // Memoized fetch để tránh recreate function trong useEffect
  const fetchConversations = useCallback(async (showLoader = true) => {
    if (!user?.id) return
    
    try {
      if (showLoader && isMounted.current) setLoading(true)
      setError(null)
      
      const response = await messagesService.getConversations({ limit: 20 })
      
      if (isMounted.current) {
        setConversations(response.data)
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
      if (isMounted.current) {
        setError('Unable to load conversations. Pull down to retry.')
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [user?.id])
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchConversations(false)
  }, [fetchConversations])
  
  // Xử lý tin nhắn mới qua WebSocket
  const handleNewMessage = useCallback((message: MessageDto) => {
    if (!user?.id) return
    
    const currentUserId = Number(user.id)
    const otherUserId = message.senderId === currentUserId 
      ? message.receiverId 
      : message.senderId
    
    setConversations(prev => {
      // Tìm cuộc hội thoại hiện có
      const existingIndex = prev.findIndex(conv => 
        conv.user && conv.user.id === otherUserId
      )
      
      // Clone array để không thay đổi state trực tiếp
      const updated = [...prev]
      
      if (existingIndex !== -1) {
        // Cập nhật cuộc hội thoại hiện có
        const updatedItem = {
          ...updated[existingIndex],
          lastMessage: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            isRead: message.isRead
          }
        }
        
        // Tăng số tin nhắn chưa đọc nếu người dùng nhận tin nhắn
        if (message.receiverId === currentUserId && !message.isRead) {
          updatedItem.unreadCount = (updatedItem.unreadCount || 0) + 1
        }
        
        // Cập nhật item trong mảng
        updated[existingIndex] = updatedItem
        
        // Di chuyển cuộc hội thoại lên đầu
        if (existingIndex > 0) {
          const [itemToMove] = updated.splice(existingIndex, 1)
          updated.unshift(itemToMove)
          return updated
        }
        
        return updated
      } else if (message.sender && message.receiver) {
        // Thêm cuộc hội thoại mới nếu chưa có
        const otherUser = message.senderId === currentUserId 
          ? message.receiver 
          : message.sender
        
        if (otherUser) {
          // Tạo cuộc hội thoại mới và đặt ở đầu danh sách
          const newConversation: EnhancedConversationItem = {
            user: otherUser,
            lastMessage: {
              id: message.id,
              content: message.content,
              createdAt: message.createdAt,
              isRead: message.isRead
            },
            unreadCount: message.receiverId === currentUserId && !message.isRead ? 1 : 0
          }
          
          return [newConversation, ...updated]
        }
      }
      
      // Nếu không đủ thông tin để cập nhật, fetch lại
      fetchConversations(false)
      return prev
    })
  }, [user?.id, fetchConversations])
  
  // Xử lý khi tin nhắn được đánh dấu đã đọc
  const handleMessagesRead = useCallback((data: { by: number }) => {
    if (!user?.id || !data.by) return
    
    // Chỉ cập nhật nếu người đánh dấu đã đọc là người nhận tin nhắn của user hiện tại
    setConversations(prev => 
      prev.map(conv => 
        conv.user.id === data.by
          ? { ...conv, unreadCount: 0, lastMessage: { ...conv.lastMessage, isRead: true } }
          : conv
      )
    )
  }, [user?.id])

  // Xử lý khi trạng thái typing của người dùng khác thay đổi
  const handleUserTyping = useCallback((status: { userId: number, isTyping: boolean }) => {
    if (!user?.id) return

    setConversations(prev => {
      return prev.map(conv => {
        if (conv.user && conv.user.id === status.userId) {
          return { ...conv, isTyping: status.isTyping }
        }
        return conv
      })
    })
  }, [user?.id])

  // Effect xử lý trạng thái kết nối WebSocket
  useEffect(() => {
    const handleConnectionStatus = (status: boolean) => {
      setSocketConnected(status);
      setSocketConnecting(false);
      
      // Nếu kết nối được phục hồi, cập nhật dữ liệu
      if (status && isMounted.current) {
        fetchConversations(false);
      }
    };

    const unsubscribe = messageSocketInstance.onConnectionStatus((status) => {
      handleConnectionStatus(status);
    });

    // Check websocket connection status
    if (!messageSocketInstance.isConnected()) {
      setSocketConnecting(messageSocketInstance.isConnecting());
    } else {
      setSocketConnected(true);
    }

    return () => {
      unsubscribe();
    };
  }, [fetchConversations]);

  // Effect để khởi tạo WebSocket và lắng nghe sự kiện
  useEffect(() => {
    isMounted.current = true
    
    // Khởi tạo dữ liệu ban đầu
    fetchConversations()
    
    // Kết nối WebSocket nếu có user và token
    if (user?.id && token) {
      // Đảm bảo kết nối WebSocket
      messageSocketInstance.connect(Number(user.id), token)
      
      // Lắng nghe sự kiện tin nhắn mới
      const unsubscribeNewMessage = messageSocketInstance.onNewMessage(handleNewMessage)
      
      // Lắng nghe sự kiện đọc tin nhắn
      const unsubscribeMessagesRead = messageSocketInstance.onMessagesRead(handleMessagesRead)

      // Lắng nghe sự kiện typing
      const unsubscribeUserTyping = messageSocketInstance.onUserTyping(handleUserTyping)

      // Lắng nghe sự kiện lỗi
      const unsubscribeError = messageSocketInstance.onError((error) => {
        console.error('WebSocket error:', error)
      })
      
      // Cleanup function
      return () => {
        isMounted.current = false
        unsubscribeNewMessage()
        unsubscribeMessagesRead()
        unsubscribeUserTyping()
        unsubscribeError()
      }
    }
    
    return () => {
      isMounted.current = false
    }
  }, [user?.id, token, fetchConversations, handleNewMessage, handleMessagesRead, handleUserTyping])

  const formatLastActive = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return ''
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'CQ'
    const nameParts = name.split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
    }
    return nameParts[0].substring(0, 2).toUpperCase()
  }

  const renderItem = ({ item }: { item: EnhancedConversationItem }) => {
    const { user: chatUser, lastMessage, unreadCount = 0, isTyping } = item
    const fullName = `${chatUser.firstName} ${chatUser.lastName}`

    return (
      <TouchableOpacity
        style={chatListStyles.conversationItem}
        onPress={() => router.push(`/message/${chatUser.id}`)}
        activeOpacity={0.7}
      >
        <View style={chatListStyles.avatarContainer}>
          {chatUser.photo ? (
            <Image
              source={{ uri: chatUser.photo }}
              style={chatListStyles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={chatListStyles.initialsContainer}>
              <Text style={chatListStyles.initialsText}>{getInitials(fullName)}</Text>
            </View>
          )}
        </View>

        <View style={chatListStyles.messageInfoContainer}>
          <View style={chatListStyles.nameTimeContainer}>
            <Text style={chatListStyles.nameText} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={chatListStyles.timeText}>
              {formatLastActive(lastMessage.createdAt)}
            </Text>
          </View>

          <View style={chatListStyles.previewContainer}>
            {isTyping ? (
              <Text style={chatListStyles.typingText}>
                typing...
              </Text>
            ) : (
              <Text
                style={[
                  chatListStyles.previewText,
                  unreadCount > 0 && chatListStyles.unreadPreviewText,
                ]}
                numberOfLines={1}
              >
                {lastMessage.content || "Photo"}
              </Text>
            )}

            {unreadCount > 0 && (
              <View style={chatListStyles.unreadBadge}>
                <Text style={chatListStyles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={chatListStyles.emptyContainer}>
          <ActivityIndicator size="large" color="#FFC83C" />
          <Text style={chatListStyles.emptyText}>Loading conversations...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={chatListStyles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FFC83C" />
          <Text style={chatListStyles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={chatListStyles.retryButton}
            onPress={() => fetchConversations()}
          >
            <Text style={chatListStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={chatListStyles.emptyContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={40} color="#FFC83C" />
        <Text style={chatListStyles.emptyText}>No conversations yet</Text>
        <Text style={chatListStyles.emptySubText}>
          Start chatting with friends to connect!
        </Text>
      </View>
    )
  }

  const onStartChat = () => {
    // Navigate to user list or friend list to start a chat
    router.push('/');
  }

  return (
    <SafeAreaView style={chatListStyles.container}>
      <StatusBar style="light" />
      
      {/* Connection status indicator */}
      <ConnectionStatus 
        isConnected={socketConnected} 
        isConnecting={socketConnecting} 
      />
      
      <View style={chatListStyles.headerContainer}>
        <Text style={chatListStyles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={onStartChat}>
          <Ionicons name="create-outline" size={24} color="#FFC83C" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => `conversation-${item.user.id}`}
        contentContainerStyle={[
          chatListStyles.listContent,
          conversations.length === 0 && { flex: 1 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFC83C"
            colors={["#FFC83C"]}
          />
        }
        ListEmptyComponent={renderEmptyList}
      />
    </SafeAreaView>
  )
}
