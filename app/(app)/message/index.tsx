import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "expo-image"
import messagesService, { ConversationItem } from '@/lib/services/messages'
import { useAuthStore } from '@/lib/stores/auth-store'
import { formatDistanceToNow } from 'date-fns'

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
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (err) {
      return dateString
    }
  }

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const fullName = item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown'
    
    return (
      <TouchableOpacity 
        className="flex-row items-center py-3 px-4"
        activeOpacity={0.7}
        onPress={() => router.push(`/message/${item.user?.id}`)}
      >
        <View className="relative">
          <Image
            source={{ uri: item.user?.photo || 'https://picsum.photos/200' }}
            style={styles.avatar}
            className="rounded-full border-2 border-yellow-400"
          />
          {(item.unreadCount > 0) && (
            <View className="absolute bottom-0 right-0 bg-blue-500 w-3 h-3 rounded-full border border-black" />
          )}
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-lg font-bold">{fullName}</Text>
            <Text className="text-gray-400">{formatMessageTime(item.lastMessage.createdAt)}</Text>
          </View>
          <Text className="text-gray-300" numberOfLines={1}>
            {item.lastMessage.content || "Media content"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </TouchableOpacity>
    )
  }

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center pt-32">
          <ActivityIndicator size="large" color="#FFC83C" />
          <Text className="text-gray-400 mt-4">Loading conversations...</Text>
        </View>
      )
    }
    
    if (error) {
      return (
        <View className="flex-1 justify-center items-center pt-32">
          <Ionicons name="alert-circle-outline" size={40} color="#FFC83C" />
          <Text className="text-gray-400 mt-4 text-center px-8">{error}</Text>
        </View>
      )
    }
    
    return (
      <View className="flex-1 justify-center items-center pt-32">
        <Ionicons name="chatbubble-outline" size={40} color="#FFC83C" />
        <Text className="text-gray-400 mt-4">No messages yet</Text>
        <Text className="text-gray-500 mt-2 text-center px-8">
          Your conversations with friends will appear here
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View className="flex-1">
        <View className="pt-12 pb-4 px-4 border-b border-gray-800">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Messages</Text>
            <View style={{width: 28}} />
          </View>
        </View>

        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={item => item.user?.id?.toString() || item.lastMessage.id}
          contentContainerClassName={`${conversations.length === 0 ? 'flex-1' : ''} pb-20`}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFC83C"
              colors={["#FFC83C"]}
            />
          }
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  avatar: {
    width: 55,
    height: 55,
  }
})