import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "expo-image"
import messagesService, { ConversationItem } from '@/lib/services/messages'
import { useAuthStore } from '@/lib/stores/auth-store'
import { formatDistanceToNow } from 'date-fns'
import { chatListStyles } from './styles/chatListStyles'
export default function Chat() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchConversations = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true)
      setError(null)
      
      const response = await messagesService.getConversations({ limit: 20 })
      setConversations(response.data)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Unable to load conversations. Pull down to retry.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchConversations(false)
  }
  
  useEffect(() => {
    fetchConversations()
  }, [])

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
        style={chatListStyles.conversationItem}
        activeOpacity={0.7}
        onPress={() => router.push(`/message/${item.user?.id}`)}
      >
        <View style={chatListStyles.avatarContainer}>
          {item.user?.photo ? (
            <Image
              source={{ uri: item.user?.photo || 'https://picsum.photos/200' }}
              style={chatListStyles.avatar}
            />
          ) : (
            <View style={chatListStyles.initialsContainer}>
              <Text style={chatListStyles.initialsText}>{initials}</Text>
            </View>
          )}
        </View>
        
        <View style={chatListStyles.contentContainer}>
          <View style={chatListStyles.headerRow}>
            <Text style={chatListStyles.nameText}>{fullName}</Text>
            <Text style={chatListStyles.timeText}>{formatMessageTime(item.lastMessage.createdAt)}</Text>
          </View>
          <Text style={chatListStyles.messageText} numberOfLines={1}>
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
      />
    </SafeAreaView>
  )
}
