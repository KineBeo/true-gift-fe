import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';

import { getConversations } from '../services/api';

interface Conversation {
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

interface ConversationsScreenProps {
  onBack: () => void;
  onOpenChat: (friendId: number, friendName: string, friendEmail: string) => void;
}

export const ConversationsScreen = ({ onBack, onOpenChat }: ConversationsScreenProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasMore: true,
  });

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPagination({
          page: 1,
          limit: 20,
          hasMore: true,
        });
      } else if (!refresh && !loading) {
        setLoading(true);
      }

      const { data, meta } = await getConversations(
        refresh ? 1 : pagination.page,
        pagination.limit
      );

      if (refresh || pagination.page === 1) {
        setConversations(data || []);
      } else {
        setConversations((prev) => [...prev, ...(data || [])]);
      }

      setPagination({
        ...pagination,
        page: refresh ? 2 : pagination.page + 1,
        hasMore: (data || []).length === pagination.limit,
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách cuộc trò chuyện:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      if (refresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    loadConversations(true);
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading && !refreshing) {
      loadConversations();
    }
  };

  // Thêm hàm xử lý khi màn hình được focus để tự động làm mới dữ liệu
  useEffect(() => {
    // Làm mới dữ liệu khi component mount
    handleRefresh();

    // Thiết lập interval làm mới dữ liệu mỗi 30 giây
    const refreshInterval = setInterval(() => {
      if (!refreshing && !loading) {
        handleRefresh();
      }
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} ngày trước`;
    }

    if (diffHours > 0) {
      return `${diffHours} giờ trước`;
    }

    if (diffMinutes > 0) {
      return `${diffMinutes} phút trước`;
    }

    return 'Vừa xong';
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const firstName = item.user.firstName || '';
    const lastName = item.user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = fullName || 'Người dùng';
    const initial = firstName ? firstName.charAt(0).toUpperCase() : 'U';

    return (
      <TouchableOpacity
        className="flex-row border-b border-zinc-800 p-4"
        onPress={() => onOpenChat(item.user.id, displayName, item.user.email)}>
        <View className="mr-3">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-zinc-700">
            <Text className="text-xl text-white">{initial}</Text>
          </View>
          {item.unreadCount > 0 && (
            <View className="absolute right-0 top-0 h-5 w-5 items-center justify-center rounded-full bg-yellow-400">
              <Text className="text-xs font-bold text-black">{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View className="flex-1 justify-center">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-white">{displayName}</Text>
            <Text className="text-xs text-gray-400">
              {formatLastActive(item.lastMessage.createdAt)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text
              className={`${item.unreadCount > 0 ? 'font-semibold text-white' : 'text-gray-400'} flex-1`}
              numberOfLines={1}>
              {item.lastMessage.content}
            </Text>
            {!item.lastMessage.isRead && (
              <View className="ml-2 h-3 w-3 rounded-full bg-yellow-400" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center border-b border-zinc-800 px-4 py-3">
        <TouchableOpacity onPress={onBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-white">Tin nhắn</Text>
      </View>

      {loading && conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFBB00" />
          <Text className="mt-4 text-white">Đang tải cuộc trò chuyện...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.user.id.toString()}
          contentContainerStyle={{ flexGrow: 1 }}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Ionicons name="chatbubbles-outline" size={60} color="#666" />
              <Text className="mt-4 px-5 text-center text-white">
                Bạn chưa có cuộc trò chuyện nào.
              </Text>
              <TouchableOpacity
                className="mt-4 rounded-full bg-yellow-400 px-4 py-2"
                onPress={onBack}>
                <Text className="font-semibold text-black">Tìm bạn bè</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loading && conversations.length > 0 ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#FFBB00" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};
