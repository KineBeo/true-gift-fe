import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, FlatList, Keyboard, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Ionicons from "@expo/vector-icons/Ionicons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import AntDesign from "@expo/vector-icons/AntDesign"
import { Image } from "expo-image"
import messagesService, { MessageDto } from '@/lib/services/messages'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/auth-store'

// Extended MessageDto type that can include a client-side ID for optimistic updates
type MessageWithClientId = MessageDto & { clientId?: string }

export default function ChatDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  
  // Safely parse the ID to a number
  const receiverId = React.useMemo(() => {
    try {
      if (!id) return 0
      const parsed = parseInt(id, 10)
      return isNaN(parsed) ? 0 : parsed
    } catch (e) {
      return 0
    }
  }, [id])
  
  const [messages, setMessages] = useState<MessageWithClientId[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [friendDetails, setFriendDetails] = useState<{
    name: string;
    avatar?: string;
  }>({ name: 'Chat', avatar: undefined })

  // Fetch messages
  const fetchMessages = useCallback(async (showLoader = true) => {
    if (receiverId <= 0) {
      setError('Invalid recipient')
      setLoading(false)
      return
    }

    try {
      if (showLoader) setLoading(true)
      setError(null)
      
      const response = await messagesService.getMessages({ 
        receiverId: receiverId,
        limit: 50,
      })
      
      if (response.data.length > 0) {
        setMessages(response.data)
        
        // Mark messages as read
        try {
          await messagesService.markAsRead(receiverId)
        } catch (err) {
          console.error('Error marking messages as read:', err)
        }
        
        // Extract friend details from first message
        const firstMessage = response.data[0]
        if (firstMessage && user) {
          const otherUser = firstMessage.senderId === Number(user.id)
            ? firstMessage.receiver 
            : firstMessage.sender
            
          if (otherUser) {
            setFriendDetails({
              name: `${otherUser.firstName} ${otherUser.lastName}`,
              avatar: otherUser.photo
            })
          }
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Unable to load messages. Pull down to retry.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [receiverId, user])
  
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchMessages(false)
  }
  
  useEffect(() => {
    fetchMessages()
    
    // Poll for new messages every 15 seconds
    const interval = setInterval(() => {
      fetchMessages(false)
    }, 15000)
    
    return () => clearInterval(interval)
  }, [fetchMessages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending || !user || receiverId <= 0) {
      return
    }

    const trimmedMessage = inputMessage.trim()
    setInputMessage('')
    setSending(true)
    
    // Generate a temporary client ID for optimistic updates
    const tempClientId = `temp-${Date.now()}`
    
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
      updatedAt: new Date().toISOString()
    }
    
    // Add to messages list immediately (optimistic update)
    setMessages(prev => [...prev, optimisticMessage])
    
    try {
      // Send to API
      const sentMessage = await messagesService.sendMessage({
        receiverId: receiverId,
        content: trimmedMessage,
      })
      
      // Replace optimistic message with actual message from server
      setMessages(prev => 
        prev.map(msg => 
          msg.clientId === tempClientId ? sentMessage : msg
        )
      )
    } catch (err) {
      console.error('Error sending message:', err)
      
      // Show error
      Alert.alert(
        'Message Not Sent',
        'Your message could not be sent. Please try again.',
        [{ text: 'OK' }]
      )
      
      // Remove optimistic message
      setMessages(prev => 
        prev.filter(msg => msg.clientId !== tempClientId)
      )
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a')
    } catch (err) {
      return ''
    }
  }

  const formatHeaderTime = (dateString?: string) => {
    if (!dateString) return ''
    
    try {
      return format(new Date(dateString), 'MMM d, h:mm a')
    } catch (err) {
      return ''
    }
  }

  const renderItem = ({ item }: { item: MessageWithClientId }) => {
    if (!user) return null
    const isUserMessage = item.senderId === Number(user.id)

    return (
      <View 
        className={`px-4 py-2 my-1 max-w-[80%] rounded-2xl ${
          isUserMessage 
            ? 'bg-gray-300 self-end' 
            : 'bg-gray-800 self-start'
        }`}
        style={isUserMessage ? styles.sentMessage : styles.receivedMessage}
      >
        <Text 
          className={`${isUserMessage ? 'text-black' : 'text-white'} text-base font-extrabold`}
        >
          {item.content}
        </Text>
        {/* <Text 
          className={`${isUserMessage ? 'text-gray-600' : 'text-gray-400'} text-xs mt-1 text-right`}
        >
          {formatMessageTime(item.createdAt)}
        </Text> */}
      </View>
    )
  }

  const renderTimeHeader = () => {
    const firstMessage = messages[0]
    
    return (
      <View className="py-2 items-center">
        <Text className="text-gray-500 text-center">
          {firstMessage ? formatHeaderTime(firstMessage.createdAt) : 'Start of conversation'}
        </Text>
      </View>
    )
  }
  
  const renderEmptyList = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFC83C" />
          <Text className="text-gray-400 mt-4">Loading messages...</Text>
        </View>
      )
    }
    
    if (error) {
      return (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="alert-circle-outline" size={40} color="#FFC83C" />
          <Text className="text-gray-400 mt-4 text-center px-8">{error}</Text>
        </View>
      )
    }
    
    return (
      <View className="flex-1 justify-center items-center">
        <Ionicons name="chatbubble-outline" size={40} color="#FFC83C" />
        <Text className="text-gray-400 mt-4">No messages yet</Text>
        <Text className="text-gray-500 mt-2 text-center px-8">
          Send a message to start the conversation
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : 0}
      >
        {/* Header */}
        <View className="p-4 flex-row items-center justify-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute left-4"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          
          <View className="flex-row items-center">
            <Image
              source={{ uri: friendDetails.avatar || 'https://picsum.photos/200' }}
              style={styles.avatar}
              contentFit="contain"
            />
            
            <Text className="text-white text-2xl font-bold ml-3">
              {friendDetails.name}
            </Text>
          </View>
          
          <TouchableOpacity className="absolute right-4">
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Messages */}
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerClassName={`${messages.length === 0 ? 'flex-1' : ''} p-4 pb-6`}
          ListHeaderComponent={messages.length > 0 ? renderTimeHeader : null}
          ListEmptyComponent={renderEmptyList}
          inverted={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFC83C"
              colors={["#FFC83C"]}
            />
          }
        />
        
        {/* Message Input */}
        <View className="p-2">
          <View className="flex-row items-center bg-zinc-800 rounded-full px-4 py-2">
            <TextInput
              className="flex-1 text-gray-300 text-base mr-2 font-bold p-2"
              placeholder="Send message..."
              placeholderTextColor="white"
              value={inputMessage}
              onChangeText={setInputMessage}
              style={styles.input}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              editable={!sending}
            />
            
            <View className="flex-row">
              <TouchableOpacity 
                className="mr-3"
                disabled={sending}
                onPress={sendMessage}
              >
                <Ionicons 
                  name="arrow-up-circle-sharp" 
                  size={30} 
                  color={inputMessage.trim() ? "#FFC83C" : "#555"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity className="mr-3">
                <MaterialIcons name="emoji-emotions" size={30} color="#FFC83C" />
              </TouchableOpacity>
              
              <TouchableOpacity className="mr-3">
                <Ionicons name="flame" size={30} color="#F24E1E" />
              </TouchableOpacity>
              
              <TouchableOpacity>
                <Ionicons name="happy-outline" size={30} color="#ABABAB" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 20,
  },
  sentMessage: {
    marginLeft: 40
  },
  receivedMessage: {
    marginRight: 40
  },
  inputContainer: {
    backgroundColor: '#000',
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
  }
}) 