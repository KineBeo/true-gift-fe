import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "expo-image"
import messagesService, { ConversationItem, messageSocketInstance, MessageDto } from '@/lib/services/messages'
import { useAuthStore } from '@/lib/stores/auth-store'
import { formatDistanceToNow } from 'date-fns'
import chatListStyles from './styles/chatListStyles'

export default function Chat() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
          const newConversation: ConversationItem = {
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
  
  // Effect để khởi tạo WebSocket và lắng nghe sự kiện
  useEffect(() => {
    isMounted.current = true
    
    // Khởi tạo dữ liệu ban đầu
    fetchConversations()
    
    // Kết nối WebSocket nếu có user
    if (user?.id) {
      messageSocketInstance.connect(Number(user.id))
      
      // Lắng nghe sự kiện tin nhắn mới
      const unsubscribeNewMessage = messageSocketInstance.onNewMessage(handleNewMessage)
      
      // Lắng nghe sự kiện đọc tin nhắn
      const unsubscribeMessagesRead = messageSocketInstance.onMessagesRead(handleMessagesRead)
      
      // Cleanup function
      return () => {
        isMounted.current = false
        unsubscribeNewMessage()
        unsubscribeMessagesRead()
      }
    }
    
    return () => {
      isMounted.current = false
    }
  }, [user?.id, fetchConversations, handleNewMessage, handleMessagesRead])

  const formatMessageTime = (dateString: string) => {
    try {
      // Format similar to the image: "4d", "6d", "20 Jan", etc.
      const date = new Date(dateString)
      const now = new Date()
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays < 30) {
        return diffInDays === 0 ? 'Today' : `${diffInDays}d`
      } else {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      }
    } catch (err) {
      return dateString
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'CQ';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const fullName = item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown'
    const initials = getInitials(fullName);
    
    return (
      <TouchableOpacity 
        style={[
          chatListStyles.conversationItem, 
          item.unreadCount > 0 && chatListStyles.unreadConversation
        ]}
        activeOpacity={0.7}
        onPress={() => router.push(`/message/${item.user?.id}`)}
      >
        <View style={chatListStyles.avatarContainer}>
          {item.user?.photo ? (
            <Image
              source={{ uri: item.user?.photo || 'https://picsum.photos/200' }}
              style={chatListStyles.avatar}
              transition={300}
              cachePolicy="memory"
            />
          ) : (
            <View style={chatListStyles.initialsContainer}>
              <Text style={chatListStyles.initialsText}>{initials}</Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={chatListStyles.unreadBadge}>
              <Text style={chatListStyles.unreadBadgeText}>
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={chatListStyles.contentContainer}>
          <View style={chatListStyles.headerRow}>
            <Text style={[
              chatListStyles.nameText,
              item.unreadCount > 0 && chatListStyles.boldText
            ]}>
              {fullName}
            </Text>
            <Text style={chatListStyles.timeText}>{formatMessageTime(item.lastMessage.createdAt)}</Text>
          </View>
          <Text 
            style={[
              chatListStyles.messageText, 
              item.unreadCount > 0 && chatListStyles.boldText
            ]} 
            numberOfLines={1}
          >
            {item.lastMessage.content || "No replies yet!"}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={24} color="#666" style={chatListStyles.chevron} />
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
        </View>
      )
    }
    
    return (
      <View style={chatListStyles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={40} color="#FFC83C" />
        <Text style={chatListStyles.emptyText}>No messages yet</Text>
        <Text style={chatListStyles.emptySubtext}>
          Your conversations with friends will appear here
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={chatListStyles.container}>
      <StatusBar style="light" />
      <View style={chatListStyles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={chatListStyles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-extrabold text-2xl">Messages</Text>
        <View style={chatListStyles.headerRight} />
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.user?.id?.toString() || item.lastMessage.id}
        contentContainerStyle={[
          chatListStyles.listContent,
          conversations.length === 0 && chatListStyles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFC83C"
            colors={["#FFC83C"]}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  )
}
