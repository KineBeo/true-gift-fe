import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, Alert, ActivityIndicator, Modal, FlatList, TextInput, AppState } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { getProfile, getFriends, getFriendRequests, acceptFriendRequest, removeFriend, sendFriendRequest, getConversations } from '../services/api';

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
    'https://images.unsplash.com/photo-1674574124792-3be232f1869f'
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
      console.log('Friends response data structure:', JSON.stringify(friendsResponse.data?.[0] || {}).substring(0, 200));
      
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
        email: `ID: ${item.friendId}`
      };
    }
    
    return (
      <View className="flex-row justify-between items-center p-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-zinc-700 rounded-full items-center justify-center mr-3">
            <Text className="text-white font-bold">
              {friendInfo.firstName ? friendInfo.firstName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View>
            <Text className="text-white font-medium">
              {friendInfo.firstName || ''} {friendInfo.lastName || ''}
            </Text>
            <Text className="text-gray-400 text-sm">{friendInfo.email}</Text>
          </View>
        </View>
        <TouchableOpacity 
          className="bg-yellow-400 rounded-full px-3 py-1 flex-row items-center"
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
                onOpenChat(
                  entityFriendId,
                  'Bạn bè', 
                  `ID: ${entityFriendId}`
                );
              } else {
                Alert.alert('Lỗi', 'Không thể mở cuộc trò chuyện do ID không hợp lệ');
              }
            }
          }}
        >
          <Ionicons name="chatbubble-outline" size={16} color="black" style={{ marginRight: 4 }} />
          <Text className="text-black font-medium">Nhắn tin</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render danh sách lời mời kết bạn
  const renderRequestItem = ({ item }: { item: Friend }) => (
    <View className="bg-zinc-800 rounded-lg p-3 mb-2">
      <View className="flex-row items-center">
        <View className="w-10 h-10 bg-zinc-700 rounded-full items-center justify-center mr-3">
          <Text className="text-white">{item.user?.firstName?.[0] || '?'}</Text>
        </View>
        <View>
          <Text className="text-white font-medium">
            {item.user?.firstName || ''} {item.user?.lastName || ''}
          </Text>
          <Text className="text-gray-400 text-xs">{item.user?.email}</Text>
        </View>
      </View>
      
      <View className="flex-row justify-end mt-3">
        <TouchableOpacity 
          className="bg-red-500 px-4 py-2 rounded-full mr-2"
          onPress={() => handleDeclineFriend(item)}
        >
          <Text className="text-white">Từ chối</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="bg-green-500 px-4 py-2 rounded-full"
          onPress={() => handleAcceptRequest(item.id)}
        >
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
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: onLogout }
      ]
    );
  };
  
  // Modal quản lý bạn bè
  const renderFriendsModal = () => (
    <Modal
      visible={showFriendsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFriendsModal(false)}
      statusBarTranslucent={false}
    >
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row justify-between items-center px-5 mb-5">
          <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Bạn bè</Text>
          <TouchableOpacity 
            onPress={() => {
              setShowFriendsModal(false);
              setTimeout(() => setShowAddFriendModal(true), 300);
            }}
            className="w-10 h-10 bg-zinc-700 rounded-full items-center justify-center"
          >
            <Ionicons name="person-add-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row px-5 mb-5">
          <TouchableOpacity 
            className={`mr-5 pb-2 ${activeTab === 'friends' ? 'border-b-2 border-yellow-400' : ''}`}
            onPress={() => setActiveTab('friends')}
          >
            <Text className={`text-lg ${activeTab === 'friends' ? 'text-white' : 'text-gray-500'}`}>
              Bạn bè ({friends.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`pb-2 ${activeTab === 'requests' ? 'border-b-2 border-yellow-400' : ''}`}
            onPress={() => setActiveTab('requests')}
          >
            <Text className={`text-lg ${activeTab === 'requests' ? 'text-white' : 'text-gray-500'}`}>
              Lời mời ({friendRequests.length})
            </Text>
          </TouchableOpacity>
        </View>
        
        {friendsLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FFBB00" />
            <Text className="text-white mt-4">Đang tải...</Text>
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
                  <Text className="text-white text-lg mb-5">Bạn chưa có bạn bè nào</Text>
                  <TouchableOpacity 
                    className="bg-yellow-400 rounded-full px-4 py-2"
                    onPress={() => {
                      setShowFriendsModal(false);
                      setTimeout(() => setShowAddFriendModal(true), 300);
                    }}
                  >
                    <Text className="text-black font-bold">Thêm bạn mới</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              friendRequests.length > 0 ? (
                <FlatList
                  data={friendRequests}
                  renderItem={renderRequestItem}
                  keyExtractor={(item) => item.id}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-white text-lg">Không có lời mời kết bạn nào</Text>
                </View>
              )
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
      statusBarTranslucent={false}
    >
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row justify-between items-center px-5 mb-5">
          <TouchableOpacity onPress={() => setShowAddFriendModal(false)}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Thêm bạn</Text>
          <View style={{ width: 28 }} />
        </View>
        
        <View className="px-5 pt-5">
          <Text className="text-white text-lg mb-3">Nhập email của bạn bè</Text>
          <TextInput
            className="bg-zinc-800 text-white px-4 py-3 rounded-lg mb-4"
            placeholder="Email"
            placeholderTextColor="#666"
            value={friendEmail}
            onChangeText={setFriendEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            className="bg-yellow-400 py-3 rounded-lg items-center"
            onPress={handleAddFriend}
            disabled={friendsLoading}
          >
            {friendsLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-black font-bold text-lg">Gửi lời mời kết bạn</Text>
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
        const totalUnread = data.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
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
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FFBB00" />
        <Text className="text-white mt-4">Đang tải...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Text className="text-white text-center mb-4">Không có quyền truy cập camera</Text>
        <Text className="text-gray-400 text-center mb-8">
          Ứng dụng cần quyền truy cập vào camera và thư viện ảnh để hoạt động.
          Vui lòng mở cài đặt và cấp quyền cho ứng dụng.
        </Text>
        <TouchableOpacity 
          className="bg-yellow-400 rounded-full px-6 py-3"
          onPress={() => setHasPermission(null)}
        >
          <Text className="text-black font-bold">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
        <TouchableOpacity 
          className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row items-center bg-zinc-800 rounded-full px-5 py-2"
          onPress={() => setShowFriendsModal(true)}
        >
          <Ionicons name="people" size={20} color="white" />
          <Text className="text-white ml-2 text-lg font-medium">
            {friendCount === 0 ? 'Thêm bạn bè' : `${friendCount} bạn bè`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center"
          onPress={() => {
            if (friends.length > 0) {
              onOpenConversations();
            } else {
              Alert.alert('Thông báo', 'Bạn chưa có bạn bè nào để nhắn tin');
            }
          }}
        >
          <Ionicons name="chatbubble-outline" size={24} color="white" />
          {unreadMessageCount > 0 && (
            <View className="absolute top-0 right-0 bg-yellow-400 rounded-full min-w-5 h-5 items-center justify-center px-1">
              <Text className="text-black text-xs font-bold">{unreadMessageCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* User Info */}
      {userProfile && (
        <View className="px-4 mt-4">
          <Text className="text-white text-center text-lg">
            Xin chào, {userProfile.firstName || ''} {userProfile.lastName || ''}!
          </Text>
          <Text className="text-gray-400 text-center text-sm mt-1">
            {userProfile.email}
          </Text>
        </View>
      )}
      
      {/* Main Content / Camera View */}
      <View className="flex-1 justify-center items-center mt-4">
        <View className="w-[90%] aspect-square rounded-[40px] overflow-hidden">
          {currentImage ? (
            <TouchableOpacity onPress={() => setCurrentImage(null)}>
              <Image 
                source={{ uri: currentImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View className="w-full h-full bg-zinc-900 items-center justify-center">
              <Text className="text-white text-xl mb-2">Camera {isFrontCamera ? 'trước' : 'sau'}</Text>
              <Text className="text-white text-md">Flash {flashEnabled ? 'bật' : 'tắt'}</Text>
              <Text className="text-white text-md mt-4">Nhấn nút tròn để chụp ảnh</Text>
            </View>
          )}
          
          {/* Indicators */}
          <View className="absolute bottom-4 right-4 bg-zinc-800/50 rounded-md px-2 py-1">
            <Text className="text-white">1×</Text>
          </View>
        </View>
      </View>
      
      {/* Camera Controls */}
      <View className="pb-8 pt-4 px-10">
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity onPress={toggleFlash}>
            <FontAwesome 
              name="bolt" 
              size={28} 
              color={flashEnabled ? "yellow" : "white"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-white items-center justify-center"
            onPress={takePicture}
          >
            <View className="w-16 h-16 rounded-full bg-white" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleCameraType}>
            <Ionicons name="refresh" size={28} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* History Button */}
        <TouchableOpacity className="items-center">
          <View className="flex-row items-center bg-zinc-800 rounded-full px-5 py-2">
            <Ionicons name="images-outline" size={20} color="white" />
            <Text className="text-white ml-2 text-lg">Lịch sử</Text>
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
        className="absolute bottom-24 right-5 w-14 h-14 bg-yellow-400 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowAddFriendModal(true)}
      >
        <Ionicons name="person-add-outline" size={26} color="black" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}; 