import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
  AppState,
} from 'react-native';

import {
  getProfile,
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  removeFriend,
  sendFriendRequest,
  getConversations,
} from '../services/api';

interface HomeScreenProps {
  onLogout: () => void;
  onOpenChat: (friendId: number, friendName: string, friendEmail: string) => void;
  onOpenConversations: () => void;
}

interface UserProfile {
  id: number | string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  provider?: string;
}

interface Friend {
  id: string;
  userId: number;
  friendId: number;
  isAccepted: boolean;
  isBlocked: boolean;
  friend?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  user?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export const HomeScreen = ({ onLogout, onOpenChat, onOpenConversations }: HomeScreenProps) => {
  const [friendCount, setFriendCount] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Demo images để mô phỏng
  const demoImages = [
    'https://images.unsplash.com/photo-1579033014049-f33886614b12',
    'https://images.unsplash.com/photo-1612464766154-2cd2e6e06273',
    'https://images.unsplash.com/photo-1674574124792-3be232f1869f',
  ];

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');

        if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
          Alert.alert('Yêu cầu quyền', 'Ứng dụng cần quyền truy cập vào camera và thư viện ảnh');
        }
      } catch (error) {
        console.error('Lỗi khi yêu cầu quyền:', error);
        Alert.alert('Lỗi', 'Không thể yêu cầu quyền truy cập. Vui lòng thử lại.');
        setHasPermission(false);
      }
    };

    fetchPermissions();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const profile = await getProfile();
        setUserProfile(profile);
        console.log('Đã tải thông tin người dùng:', profile);

        // Sau khi có profile, lấy danh sách bạn bè
        await loadFriends();
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const loadFriends = async () => {
    try {
      setFriendsLoading(true);

      // Lấy danh sách bạn bè đã được chấp nhận - thêm relations
      const friendsResponse = await getFriends({
        isAccepted: true,
        isBlocked: false,
        relations: true, // Yêu cầu backend trả về thông tin đầy đủ của bạn bè
      });

      // Log để debug
      console.log(
        'Friends response data structure:',
        JSON.stringify(friendsResponse.data?.[0] || {}).substring(0, 200)
      );

      setFriends(friendsResponse.data || []);
      setFriendCount(friendsResponse.data?.length || 0);

      // Lấy danh sách lời mời kết bạn
      const requestsResponse = await getFriendRequests();
      setFriendRequests(requestsResponse.data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bạn bè:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè. Vui lòng thử lại sau.');
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!friendEmail || !friendEmail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email của người bạn muốn thêm');
      return;
    }

    try {
      setFriendsLoading(true);

      // Gửi yêu cầu kết bạn bằng email
      const response = await sendFriendRequest(friendEmail);
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
      setFriendEmail('');
      setShowAddFriendModal(false);

      // Cập nhật lại danh sách bạn bè
      await loadFriends();
    } catch (error: any) {
      console.error('Lỗi khi thêm bạn:', error);
      if (error?.statusCode === 404) {
        Alert.alert('Lỗi', 'Không tìm thấy người dùng với email này');
      } else if (error?.statusCode === 400) {
        Alert.alert('Lỗi', error.message || 'Không thể gửi lời mời kết bạn');
      } else {
        Alert.alert('Lỗi', 'Không thể thêm bạn. Vui lòng thử lại sau.');
      }
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setFriendsLoading(true);
      const result = await acceptFriendRequest(Number(requestId));
      if (result) {
        // Cập nhật lại danh sách bạn bè và lời mời kết bạn
        await loadFriends();
        await fetchUnreadMessageCount();
        Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn');
      }
    } catch (error) {
      console.error('Lỗi khi chấp nhận lời mời kết bạn:', error);
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn');
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleDeclineFriend = async (friend: Friend) => {
    try {
      setFriendsLoading(true);
      await removeFriend(friend.id);
      Alert.alert('Thành công', 'Đã từ chối lời mời kết bạn');
      await loadFriends();
    } catch (error) {
      console.error('Lỗi khi từ chối lời mời kết bạn:', error);
      Alert.alert('Lỗi', 'Không thể từ chối lời mời kết bạn. Vui lòng thử lại sau.');
    } finally {
      setFriendsLoading(false);
    }
  };

  const takePicture = async () => {
    try {
      if (!hasPermission) {
        Alert.alert('Không có quyền', 'Vui lòng cấp quyền truy cập camera và thư viện ảnh');
        return;
      }

      // Trong thực tế, đây sẽ mở camera thực sự
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setCurrentImage(imageUri);
        console.log('Chụp ảnh thành công:', imageUri);

        // Lưu vào thư viện
        try {
          await MediaLibrary.saveToLibraryAsync(imageUri);
          console.log('Đã lưu ảnh vào thư viện');
        } catch (error) {
          console.error('Lỗi khi lưu ảnh:', error);
        }
      } else {
        // Nếu không chọn được ảnh thật, dùng ảnh mẫu
        const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
        setCurrentImage(randomImage);
      }
    } catch (error) {
      console.error('Lỗi khi chụp ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  // Render danh sách bạn bè
  const renderFriendItem = ({ item }: { item: Friend }) => {
    // Logic cải tiến để xác định thông tin bạn bè
    let friendInfo;

    // Nếu có trường friend, sử dụng trực tiếp
    if (item.friend) {
      friendInfo = item.friend;
    }
    // Nếu không có friend, kiểm tra xem đây có phải là mối quan hệ ngược không
    // (trường hợp người dùng hiện tại là friendId, và người bạn là userId)
    else if (item.user) {
      friendInfo = item.user;
    }
    // Nếu không có cả hai, có thể hiện thị thông tin cơ bản từ entity
    else {
      // Hiển thị lỗi nhưng vẫn trả về giao diện cơ bản
      console.error('Không có thông tin bạn bè đầy đủ:', item);

      // Tạo đối tượng friendInfo tạm thời
      friendInfo = {
        id: item.friendId, // Sử dụng friendId từ entity
        firstName: null,
        lastName: null,
        email: `ID: ${item.friendId}`,
      };
    }

    return (
      <View className="flex-row items-center justify-between border-b border-gray-800 p-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
            <Text className="font-bold text-white">
              {friendInfo.firstName ? friendInfo.firstName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View>
            <Text className="font-medium text-white">
              {friendInfo.firstName || ''} {friendInfo.lastName || ''}
            </Text>
            <Text className="text-sm text-gray-400">{friendInfo.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          className="flex-row items-center rounded-full bg-yellow-400 px-3 py-1"
          onPress={() => {
            // Sử dụng friendId từ đối tượng friend để tránh lỗi ID không hợp lệ
            const friendId = Number(friendInfo.id);
            if (!isNaN(friendId) && friendId > 0) {
              setShowFriendsModal(false);
              onOpenChat(
                friendId,
                `${friendInfo.firstName || ''} ${friendInfo.lastName || ''}`.trim() || 'Bạn bè',
                friendInfo.email || `ID: ${friendId}`
              );
            } else {
              console.error('Invalid friend ID:', friendInfo.id);

              // Nếu ID từ friendInfo không hợp lệ, sử dụng friendId từ entity
              const entityFriendId = Number(item.friendId);
              if (!isNaN(entityFriendId) && entityFriendId > 0) {
                setShowFriendsModal(false);
                onOpenChat(entityFriendId, 'Bạn bè', `ID: ${entityFriendId}`);
              } else {
                Alert.alert('Lỗi', 'Không thể mở cuộc trò chuyện do ID không hợp lệ');
              }
            }
          }}>
          <Ionicons name="chatbubble-outline" size={16} color="black" style={{ marginRight: 4 }} />
          <Text className="font-medium text-black">Nhắn tin</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render danh sách lời mời kết bạn
  const renderRequestItem = ({ item }: { item: Friend }) => (
    <View className="mb-2 rounded-lg bg-zinc-800 p-3">
      <View className="flex-row items-center">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
          <Text className="text-white">{item.user?.firstName?.[0] || '?'}</Text>
        </View>
        <View>
          <Text className="font-medium text-white">
            {item.user?.firstName || ''} {item.user?.lastName || ''}
          </Text>
          <Text className="text-xs text-gray-400">{item.user?.email}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row justify-end">
        <TouchableOpacity
          className="mr-2 rounded-full bg-red-500 px-4 py-2"
          onPress={() => handleDeclineFriend(item)}>
          <Text className="text-white">Từ chối</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-full bg-green-500 px-4 py-2"
          onPress={() => handleAcceptRequest(item.id)}>
          <Text className="text-white">Chấp nhận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
    console.log('Flash đã được ' + (!flashEnabled ? 'bật' : 'tắt'));
  };

  const toggleCameraType = () => {
    setIsFrontCamera(!isFrontCamera);
    console.log('Đã chuyển sang camera ' + (!isFrontCamera ? 'trước' : 'sau'));
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: onLogout },
    ]);
  };

  // Modal quản lý bạn bè
  const renderFriendsModal = () => (
    <Modal
      visible={showFriendsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFriendsModal(false)}
      statusBarTranslucent={false}>
      <SafeAreaView className="flex-1 bg-black">
        <View className="mb-5 flex-row items-center justify-between px-5">
          <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Bạn bè</Text>
          <TouchableOpacity
            onPress={() => {
              setShowFriendsModal(false);
              setTimeout(() => setShowAddFriendModal(true), 300);
            }}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
            <Ionicons name="person-add-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="mb-5 flex-row px-5">
          <TouchableOpacity
            className={`mr-5 pb-2 ${activeTab === 'friends' ? 'border-b-2 border-yellow-400' : ''}`}
            onPress={() => setActiveTab('friends')}>
            <Text className={`text-lg ${activeTab === 'friends' ? 'text-white' : 'text-gray-500'}`}>
              Bạn bè ({friends.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`pb-2 ${activeTab === 'requests' ? 'border-b-2 border-yellow-400' : ''}`}
            onPress={() => setActiveTab('requests')}>
            <Text
              className={`text-lg ${activeTab === 'requests' ? 'text-white' : 'text-gray-500'}`}>
              Lời mời ({friendRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {friendsLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FFBB00" />
            <Text className="mt-4 text-white">Đang tải...</Text>
          </View>
        ) : (
          <View className="flex-1 px-5">
            {activeTab === 'friends' ? (
              friends.length > 0 ? (
                <FlatList
                  data={friends}
                  renderItem={renderFriendItem}
                  keyExtractor={(item) => item.id}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="mb-5 text-lg text-white">Bạn chưa có bạn bè nào</Text>
                  <TouchableOpacity
                    className="rounded-full bg-yellow-400 px-4 py-2"
                    onPress={() => {
                      setShowFriendsModal(false);
                      setTimeout(() => setShowAddFriendModal(true), 300);
                    }}>
                    <Text className="font-bold text-black">Thêm bạn mới</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : friendRequests.length > 0 ? (
              <FlatList
                data={friendRequests}
                renderItem={renderRequestItem}
                keyExtractor={(item) => item.id}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-lg text-white">Không có lời mời kết bạn nào</Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  // Modal thêm bạn bè
  const renderAddFriendModal = () => (
    <Modal
      visible={showAddFriendModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddFriendModal(false)}
      statusBarTranslucent={false}>
      <SafeAreaView className="flex-1 bg-black">
        <View className="mb-5 flex-row items-center justify-between px-5">
          <TouchableOpacity onPress={() => setShowAddFriendModal(false)}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Thêm bạn</Text>
          <View style={{ width: 28 }} />
        </View>

        <View className="px-5 pt-5">
          <Text className="mb-3 text-lg text-white">Nhập email của bạn bè</Text>
          <TextInput
            className="mb-4 rounded-lg bg-zinc-800 px-4 py-3 text-white"
            placeholder="Email"
            placeholderTextColor="#666"
            value={friendEmail}
            onChangeText={setFriendEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            className="items-center rounded-lg bg-yellow-400 py-3"
            onPress={handleAddFriend}
            disabled={friendsLoading}>
            {friendsLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-lg font-bold text-black">Gửi lời mời kết bạn</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  useEffect(() => {
    fetchUnreadMessageCount();
  }, []);

  // Hàm lấy số lượng tin nhắn chưa đọc
  const fetchUnreadMessageCount = async () => {
    try {
      const { data } = await getConversations(1, 100);
      if (data) {
        const totalUnread = data.reduce(
          (sum: number, conv: any) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadMessageCount(totalUnread);
      }
    } catch (error) {
      console.error('Lỗi khi tải số tin nhắn chưa đọc:', error);
    }
  };

  // Thêm useEffect để cập nhật lại số lượng tin nhắn chưa đọc khi component được focus
  useEffect(() => {
    const unsubscribe = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchUnreadMessageCount();
      }
    });

    return () => {
      unsubscribe.remove();
    };
  }, []);

  if (hasPermission === null || profileLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#FFBB00" />
        <Text className="mt-4 text-white">Đang tải...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="mb-4 text-center text-white">Không có quyền truy cập camera</Text>
        <Text className="mb-8 text-center text-gray-400">
          Ứng dụng cần quyền truy cập vào camera và thư viện ảnh để hoạt động. Vui lòng mở cài đặt
          và cấp quyền cho ứng dụng.
        </Text>
        <TouchableOpacity
          className="rounded-full bg-yellow-400 px-6 py-3"
          onPress={() => setHasPermission(null)}>
          <Text className="font-bold text-black">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-4 pt-2">
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-full bg-zinc-800"
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center rounded-full bg-zinc-800 px-5 py-2"
          onPress={() => setShowFriendsModal(true)}>
          <Ionicons name="people" size={20} color="white" />
          <Text className="ml-2 text-lg font-medium text-white">
            {friendCount === 0 ? 'Thêm bạn bè' : `${friendCount} bạn bè`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-full bg-zinc-800"
          onPress={() => {
            if (friends.length > 0) {
              onOpenConversations();
            } else {
              Alert.alert('Thông báo', 'Bạn chưa có bạn bè nào để nhắn tin');
            }
          }}>
          <Ionicons name="chatbubble-outline" size={24} color="white" />
          {unreadMessageCount > 0 && (
            <View className="absolute right-0 top-0 h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1">
              <Text className="text-xs font-bold text-black">{unreadMessageCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* User Info */}
      {userProfile && (
        <View className="mt-4 px-4">
          <Text className="text-center text-lg text-white">
            Xin chào, {userProfile.firstName || ''} {userProfile.lastName || ''}!
          </Text>
          <Text className="mt-1 text-center text-sm text-gray-400">{userProfile.email}</Text>
        </View>
      )}

      {/* Main Content / Camera View */}
      <View className="mt-4 flex-1 items-center justify-center">
        <View className="aspect-square w-[90%] overflow-hidden rounded-[40px]">
          {currentImage ? (
            <TouchableOpacity onPress={() => setCurrentImage(null)}>
              <Image source={{ uri: currentImage }} className="h-full w-full" resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View className="h-full w-full items-center justify-center bg-zinc-900">
              <Text className="mb-2 text-xl text-white">
                Camera {isFrontCamera ? 'trước' : 'sau'}
              </Text>
              <Text className="text-md text-white">Flash {flashEnabled ? 'bật' : 'tắt'}</Text>
              <Text className="text-md mt-4 text-white">Nhấn nút tròn để chụp ảnh</Text>
            </View>
          )}

          {/* Indicators */}
          <View className="absolute bottom-4 right-4 rounded-md bg-zinc-800/50 px-2 py-1">
            <Text className="text-white">1×</Text>
          </View>
        </View>
      </View>

      {/* Camera Controls */}
      <View className="px-10 pb-8 pt-4">
        <View className="mb-8 flex-row items-center justify-between">
          <TouchableOpacity onPress={toggleFlash}>
            <FontAwesome name="bolt" size={28} color={flashEnabled ? 'yellow' : 'white'} />
          </TouchableOpacity>

          <TouchableOpacity
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-yellow-400 bg-white"
            onPress={takePicture}>
            <View className="h-16 w-16 rounded-full bg-white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleCameraType}>
            <Ionicons name="refresh" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* History Button */}
        <TouchableOpacity className="items-center">
          <View className="flex-row items-center rounded-full bg-zinc-800 px-5 py-2">
            <Ionicons name="images-outline" size={20} color="white" />
            <Text className="ml-2 text-lg text-white">Lịch sử</Text>
          </View>
          <View className="mt-2">
            <Ionicons name="chevron-down" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderFriendsModal()}
      {renderAddFriendModal()}

      {/* Nút thêm bạn bè nổi */}
      <TouchableOpacity
        className="absolute bottom-24 right-5 h-14 w-14 items-center justify-center rounded-full bg-yellow-400 shadow-lg"
        onPress={() => setShowAddFriendModal(true)}>
        <Ionicons name="person-add-outline" size={26} color="black" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};
