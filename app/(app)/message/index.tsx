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
        style={styles.conversationItem}
        activeOpacity={0.7}
        onPress={() => router.push(`/message/${item.user?.id}`)}
      >
        <View style={styles.avatarContainer}>
          {item.user?.photo ? (
            <Image
              source={{ uri: item.user?.photo || 'https://picsum.photos/200' }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.nameText}>{fullName}</Text>
            <Text style={styles.timeText}>{formatMessageTime(item.lastMessage.createdAt)}</Text>
          </View>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.lastMessage.content || "No replies yet!"}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={24} color="#666" style={styles.chevron} />
      </TouchableOpacity>
    )
  }

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FFC83C" />
          <Text style={styles.emptyText}>Loading conversations...</Text>
        </View>
      )
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FFC83C" />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      )
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={40} color="#FFC83C" />
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubtext}>
          Your conversations with friends will appear here
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-extrabold text-2xl">Messages</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.user?.id?.toString() || item.lastMessage.id}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyListContent
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
  },
  initialsContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#999',
    fontSize: 22,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    paddingRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
  },
  timeText: {
    fontSize: 14,
    color: '#888',
  },
  messageText: {
    fontSize: 15,
    color: '#999',
  },
  chevron: {
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});