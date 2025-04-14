import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';

import { getMessages, sendMessage, markMessagesAsRead, getProfile } from '../services/api';

interface Message {
  id: string;
  content: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface ChatScreenProps {
  friendId: number;
  friendName: string;
  friendEmail: string;
  onBack: () => void;
}

export const ChatScreen = ({ friendId, friendName, friendEmail, onBack }: ChatScreenProps) => {
  // Đảm bảo friendId luôn là số
  const numericFriendId = typeof friendId === 'string' ? Number(friendId) : friendId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Tải thông tin user hiện tại
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const profile = await getProfile();
        setCurrentUserId(profile.id);
      } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
      }
    };

    getUserProfile();
  }, []);

  // Tải tin nhắn
  useEffect(() => {
    loadMessages();

    // Đánh dấu tin nhắn đã đọc
    markAllAsRead();

    // Thiết lập interval để cập nhật tin nhắn mới (mỗi 15 giây thay vì 10 giây)
    // Sử dụng interval với thời gian lâu hơn để giảm số lần gọi API
    const intervalId = setInterval(() => {
      loadMessages(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [numericFriendId]);

  // Đánh dấu tin nhắn đã đọc
  const markAllAsRead = async () => {
    try {
      if (isNaN(numericFriendId)) {
        console.error('Invalid friendId for markAllAsRead:', numericFriendId);
        return;
      }
      await markMessagesAsRead(numericFriendId);
    } catch (error) {
      console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
    }
  };

  // Tải tin nhắn
  const loadMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (isNaN(numericFriendId)) {
        console.error('Invalid friendId:', numericFriendId);
        if (!silent) {
          Alert.alert('Lỗi', 'ID người dùng không hợp lệ');
        }
        setLoading(false);
        return;
      }

      // Thử lấy tin nhắn từ API
      try {
        const response = await getMessages({
          receiverId: numericFriendId,
          page: pagination.page,
          limit: pagination.limit,
        });

        // Chuẩn hóa dữ liệu để tránh lỗi null/undefined
        const messages = response?.data || [];

        // Xác định tổng số tin nhắn từ response meta (API mới) hoặc total (API cũ)
        // Ép kiểu any để tránh lỗi TypeScript
        const responseAny = response as any;
        const total = responseAny?.meta?.total || responseAny?.total || 0;

        // Cập nhật state messages
        if (pagination.page === 1) {
          setMessages(messages);
        } else {
          setMessages((prevMessages) => [...prevMessages, ...messages]);
        }

        // Cập nhật state pagination
        setPagination({
          ...pagination,
          total: total,
          hasMore: total > pagination.page * pagination.limit,
        });

        // Đánh dấu tin nhắn đã đọc
        if (messages.length > 0) {
          await markAllAsRead();
        }
      } catch (apiError: any) {
        // Chỉ hiển thị lỗi đầy đủ trong console để gỡ lỗi
        console.error('API error in loadMessages:', apiError);

        // Kiểm tra mã lỗi
        const errorStatus =
          apiError?.status ||
          apiError?.statusCode ||
          apiError?.response?.status ||
          apiError?.response?.data?.statusCode;

        // Xử lý trường hợp lỗi 404 (không có tin nhắn)
        if (errorStatus === 404) {
          console.log('Không có tin nhắn với người dùng này - sử dụng mảng rỗng');
          setMessages([]);
          setPagination({
            ...pagination,
            total: 0,
            hasMore: false,
          });
        }
        // Xử lý lỗi 422 (validation error)
        else if (errorStatus === 422) {
          // Không hiển thị thông báo khi là silent reload
          if (!silent) {
            console.warn('Lỗi validation (422) khi tải tin nhắn');
          }
          setMessages([]);
        }
        // Xử lý lỗi receiverId không hợp lệ
        else if (apiError?.errors?.receiverId) {
          if (!silent) {
            console.warn('ID người nhận không hợp lệ');
          }
          setMessages([]);
        }
        // Xử lý các lỗi khác nhưng vẫn hiển thị UI trống
        else {
          if (!silent) {
            console.warn('Sử dụng mảng tin nhắn rỗng do lỗi API');
          }
          setMessages([]);
        }
      }
    } catch (error) {
      // Lỗi khác không liên quan đến API
      console.error('Lỗi không mong muốn khi tải tin nhắn:', error);
      setMessages([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Tải thêm tin nhắn cũ
  const loadMoreMessages = () => {
    if (pagination.hasMore && !loading) {
      setPagination((prev) => ({
        ...prev,
        page: prev.page + 1,
      }));
      loadMessages();
    }
  };

  // Gửi tin nhắn mới
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);

      if (isNaN(numericFriendId)) {
        console.error('Invalid friendId for sendMessage:', numericFriendId);
        Alert.alert('Lỗi', 'Không thể gửi tin nhắn: ID người nhận không hợp lệ');
        setSending(false);
        return;
      }

      await sendMessage(numericFriendId, newMessage);

      setNewMessage('');
      // Tải lại tin nhắn để hiển thị tin nhắn mới
      await loadMessages(true);

      // Cuộn lên tin nhắn mới nhất (vì FlatList đã đảo ngược)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Lỗi khi gửi tin nhắn:', error);

      // Hiển thị thông báo lỗi cụ thể hơn cho người dùng hiểu
      if (error?.errors?.receiverId) {
        Alert.alert('Lỗi', 'Không thể gửi tin nhắn: ID người nhận không hợp lệ');
      } else if (error?.message?.includes('Không thể gửi tin nhắn cho người này')) {
        Alert.alert(
          'Lỗi',
          'Không thể gửi tin nhắn cho người này. Có thể họ không phải là bạn bè hoặc đã chặn bạn.'
        );
      } else {
        Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      }
    } finally {
      setSending(false);
    }
  };

  // Format thời gian
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    // Nếu hôm nay, chỉ hiện giờ
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Nếu hôm qua
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hôm qua ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Khác
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Render từng tin nhắn
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUserId;

    return (
      <View className={`my-1 max-w-[80%] ${isMyMessage ? 'self-end' : 'self-start'}`}>
        <View className={`rounded-2xl p-3 ${isMyMessage ? 'bg-yellow-400' : 'bg-zinc-800'}`}>
          <Text className={`${isMyMessage ? 'text-black' : 'text-white'}`}>{item.content}</Text>
        </View>
        <Text className="ml-1 mt-1 text-xs text-gray-500">
          {formatMessageTime(item.createdAt)}
          {isMyMessage && <Text className="ml-1">{item.isRead ? ' • Đã xem' : ' • Đã gửi'}</Text>}
        </Text>
      </View>
    );
  };

  // Render ngày phân cách tin nhắn
  const renderDateSeparator = (date: Date) => (
    <View className="my-3 flex-row items-center justify-center">
      <View className="h-[1px] flex-1 bg-gray-700" />
      <Text className="mx-3 text-xs text-gray-500">{date.toLocaleDateString()}</Text>
      <View className="h-[1px] flex-1 bg-gray-700" />
    </View>
  );

  // Header với thông tin người nhận
  const renderHeader = () => (
    <View className="flex-row items-center justify-between border-b border-gray-800 p-4">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={onBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
          <Text className="font-bold text-white">{friendName.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text className="font-medium text-white">{friendName}</Text>
          <Text className="text-xs text-gray-400">{friendEmail}</Text>
        </View>
      </View>
      <TouchableOpacity>
        <Ionicons name="ellipsis-vertical" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Phần nhập tin nhắn mới
  const renderMessageInput = () => (
    <View className="flex-row items-center border-t border-gray-800 p-2">
      <TouchableOpacity className="mr-2 p-2">
        <Ionicons name="add-circle-outline" size={24} color="white" />
      </TouchableOpacity>
      <TextInput
        className="flex-1 rounded-full bg-zinc-800 px-4 py-2 text-white"
        placeholder="Nhập tin nhắn..."
        placeholderTextColor="#666"
        value={newMessage}
        onChangeText={setNewMessage}
        multiline
      />
      {sending ? (
        <ActivityIndicator size="small" color="#FFBB00" className="ml-2 p-2" />
      ) : (
        <TouchableOpacity
          className="ml-2 p-2"
          onPress={handleSendMessage}
          disabled={newMessage.trim() === ''}>
          <Ionicons name="send" size={24} color={newMessage.trim() ? '#FFBB00' : '#666'} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        {renderHeader()}

        {loading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FFBB00" />
            <Text className="mt-4 text-white">Đang tải tin nhắn...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexGrow: messages.length === 0 ? 1 : undefined,
            }}
            inverted={true}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center py-10">
                <Ionicons name="chatbubble-ellipses-outline" size={60} color="#444" />
                <Text className="mt-4 text-center text-lg text-white">Chưa có tin nhắn nào</Text>
                <Text className="mt-2 px-10 text-center text-sm text-gray-400">
                  Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên.
                </Text>
              </View>
            )}
            ListFooterComponent={
              pagination.hasMore && !loading ? (
                <ActivityIndicator color="#FFBB00" size="small" style={{ marginVertical: 20 }} />
              ) : null
            }
          />
        )}

        {renderMessageInput()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
