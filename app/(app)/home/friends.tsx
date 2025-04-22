import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Feather,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import friendsService, { FriendDto, UserDto } from "../../../lib/services/friends";
import { useAuthStore } from "../../../lib/stores/auth-store";

const { width } = Dimensions.get("window");

// Define types for our data
interface Friend {
  id: number | string;
  name: string;
  avatarUrl?: string;
  avatarInitials?: string;
}

interface SocialApp {
  id: string;
  name: string;
  iconName: string;
  color: string;
}

// Social apps for connecting friends
const SOCIAL_APPS: SocialApp[] = [
  {
    id: "messenger",
    name: "Messenger",
    iconName: "facebook-messenger",
    color: "#006AFF",
  },
  {
    id: "instagram",
    name: "Insta",
    iconName: "instagram",
    color: "#E1306C",
  },
  {
    id: "messages",
    name: "Messages",
    iconName: "comment",
    color: "#34C759",
  },
  {
    id: "others",
    name: "Others",
    iconName: "link",
    color: "#8E8E93",
  },
];
export default function Friends() {
    const router = useRouter();
    const translateY = useSharedValue(1000);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
    const [totalFriends, setTotalFriends] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;
    
    // Add friend modal state
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserDto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingMoreSearchResults, setLoadingMoreSearchResults] = useState(false);
    const [searchPage, setSearchPage] = useState(1);
    const [hasMoreSearchResults, setHasMoreSearchResults] = useState(true);
    const [sendingRequests, setSendingRequests] = useState<Record<number, boolean>>({});
    const searchInputRef = useRef<TextInput>(null);
  
    // Add state for request processing
    const [processingRequests, setProcessingRequests] = useState<Record<string | number, { accepting: boolean; declining: boolean }>>({});
  
    // Helper function to format FriendDto into our Friend interface
    const formatFriend = (friendData: FriendDto): Friend => {
      const { user, friend, userId, friendId } = friendData;
  
      // Get current user ID from auth store
      const currentUserId = useAuthStore.getState().user?.id;
  
      // Determine which user object contains the friend's information
      // If userId matches current user, then friend contains the friend info
      // Otherwise, user contains the friend info
      const userInfo = String(currentUserId) === String(userId) ? friend : user;
  
      if (!userInfo) {
        return {
          id: friendData.id,
          name: "Unknown User",
          avatarInitials: "??",
        };
      }
  
      const fullName = `${userInfo.firstName} ${userInfo.lastName}`;
      const avatarInitials =
        userInfo.firstName.charAt(0) + userInfo.lastName.charAt(0);
  
      return {
        id: friendData.id,
        name: fullName,
        avatarUrl: userInfo.photo,
        avatarInitials: avatarInitials,
      };
    };
  
    // Fetch friends data
    const fetchFriends = async () => {
      try {
        setLoading(true);
        setError("");
  
        // Fetch accepted friends
        const response = await friendsService.getFriends({
          page,
          limit,
          isAccepted: true,
          includeRelations: true,
        });
  
        console.log("Current user ID:", useAuthStore.getState().user?.id);
        const formattedFriends = response.data.map(formatFriend);
        console.log("Formatted friends 111:", formattedFriends);
  
        setFriends(formattedFriends);
        setTotalFriends(response.total);
  
        // Fetch pending friend requests
        const requestsResponse = await friendsService.getFriendRequests({
          page: 1,
          limit: 5,
        });
  
        setFriendRequests(requestsResponse.data.map(formatFriend));
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError("Failed to load friends. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    // Load more friends when "Show more" is clicked
    const handleLoadMore = () => {
      if (friends.length < totalFriends) {
        setPage((prevPage) => prevPage + 1);
      }
    };
  
    // Run animation when component mounts and fetch data
    useEffect(() => {
      // translateY.value = withTiming(0, {
      //   duration: 350,
      //   easing: Easing.out(Easing.cubic),
      // });
  
      fetchFriends();
    }, []);
  
    // When page changes, fetch more friends
    useEffect(() => {
      if (page > 1) {
        loadMoreFriends();
      }
    }, [page]);
  
    const loadMoreFriends = async () => {
      try {
        const response = await friendsService.getFriends({
          page,
          limit,
          isAccepted: true,
          includeRelations: true,
        });
  
        // Append new friends to existing list
        setFriends((prev) => [...prev, ...response.data.map(formatFriend)]);
      } catch (err) {
        console.error("Error loading more friends:", err);
      }
    };
  
    // Handle search user functionality
    const handleSearch = async (resetResults = true) => {
      if (!searchQuery.trim()) return;
      
      try {
        if (resetResults) {
          setIsSearching(true);
          setSearchResults([]);
          setSearchPage(1);
          setHasMoreSearchResults(true);
        } else {
          setLoadingMoreSearchResults(true);
        }
        
        const response = await friendsService.searchUsers(searchQuery, { 
          page: resetResults ? 1 : searchPage, 
          limit: 10 
        });
        
        if (resetResults) {
          setSearchResults(response.data);
        } else {
          setSearchResults(prev => [...prev, ...response.data]);
        }
        
        setHasMoreSearchResults(response.hasNextPage);
      } catch (err) {
        console.error("Error searching users:", err);
        Alert.alert("Error", "Failed to search users. Please try again.");
      } finally {
        if (resetResults) {
          setIsSearching(false);
        } else {
          setLoadingMoreSearchResults(false);
        }
      }
    };
  
    // Handle loading more search results
    const handleLoadMoreSearchResults = () => {
      if (!hasMoreSearchResults || loadingMoreSearchResults) return;
      
      setSearchPage(prev => prev + 1);
    };
  
    // Watch for searchPage changes to load more results
    useEffect(() => {
      if (searchPage > 1 && hasMoreSearchResults) {
        handleSearch(false);
      }
    }, [searchPage]);
  
    // Handle send friend request
    const handleSendRequest = async (userId: number) => {
      try {
        setSendingRequests(prev => ({ ...prev, [userId]: true }));
        
        await friendsService.sendFriendRequest({ friendId: userId });
        
        // Show success message
        Alert.alert("Success", "Friend request sent successfully!");
        
        // Remove from search results to avoid duplicate requests
        setSearchResults(prev => prev.filter(user => user.id !== userId));
      } catch (err) {
        console.error("Error sending friend request:", err);
        Alert.alert("Error", "Failed to send friend request. Please try again.");
      } finally {
        setSendingRequests(prev => ({ ...prev, [userId]: false }));
      }
    };
  
    // Handle accepting friend request
    const handleAcceptRequest = async (requestId: string | number) => {
      try {
        // Set loading state for this specific request
        setProcessingRequests(prev => ({
          ...prev,
          [requestId]: {
            ...prev[requestId],
            accepting: true
          }
        }));
        
        // Convert to string if it's a number
        const friendshipId = typeof requestId === 'number' ? String(requestId) : requestId;
        
        // Call the API with the friendship ID
        await friendsService.acceptFriendRequest(friendshipId);
        
        // Update the UI by removing the request from the list and refreshing friends
        setFriendRequests(prev => prev.filter(request => request.id !== requestId));
        
        // Refresh friends list
        fetchFriends();
        
        // Show success message
        Alert.alert("Success", "Friend request accepted!");
      } catch (err) {
        console.error("Error accepting friend request:", err);
        Alert.alert("Error", "Failed to accept friend request. Please try again.");
      } finally {
        // Clear loading state
        setProcessingRequests(prev => ({
          ...prev,
          [requestId]: {
            ...prev[requestId],
            accepting: false
          }
        }));
      }
    };
    
    // Handle declining friend request
    const handleDeclineRequest = async (requestId: string | number) => {
      try {
        // Set loading state for this specific request
        setProcessingRequests(prev => ({
          ...prev,
          [requestId]: {
            ...prev[requestId],
            declining: true
          }
        }));
        
        // Convert to string if it's a number
        const friendshipId = typeof requestId === 'number' ? String(requestId) : requestId;
        
        // Call the API with the friendship ID to remove it
        await friendsService.removeFriend(friendshipId);
        
        // Update the UI by removing the request from the list
        setFriendRequests(prev => prev.filter(request => request.id !== requestId));
        
        // Show success message
        Alert.alert("Success", "Friend request declined!");
      } catch (err) {
        console.error("Error declining friend request:", err);
        Alert.alert("Error", "Failed to decline friend request. Please try again.");
      } finally {
        // Clear loading state
        setProcessingRequests(prev => ({
          ...prev,
          [requestId]: {
            ...prev[requestId],
            declining: false
          }
        }));
      }
    };
  
    const openSearchModal = () => {
      setIsSearchModalVisible(true);
      setSearchQuery("");
      setSearchResults([]);
      setSearchPage(1);
      setHasMoreSearchResults(true);
      
      // Focus the search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    };
  
    const closeSearchModal = () => {
      setIsSearchModalVisible(false);
    };
  
    // const animatedStyles = useAnimatedStyle(() => {
    //   return {
    //     transform: [{ translateY: translateY.value }],
    //   };
    // });
  
    const handleClose = () => {
      translateY.value = withTiming(
        1000,
        {
          duration: 300,
          easing: Easing.in(Easing.cubic),
        },
        () => {
          runOnJS(router.back)();
        }
      );
    };
  
    // Render a social app icon
    const renderSocialApp = ({ id, name, iconName, color }: SocialApp) => (
      <TouchableOpacity key={id} className="items-center mx-2">
        <View
          style={[styles.socialIconContainer, { backgroundColor: color }]}
          className="rounded-full justify-center items-center mb-2"
        >
          <FontAwesome5 name={iconName} size={28} color="white" />
        </View>
        <Text className="text-white text-base">{name}</Text>
      </TouchableOpacity>
    );
  
    // Render a friend item
    const renderFriend = (friend: Friend, isFriendRequest = false) => {
      const requestProcessing = processingRequests[friend.id] || { accepting: false, declining: false };
      
      return (
        <View
          key={friend.id}
          className="flex-row items-center justify-between py-3 px-2"
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400">
              {friend.avatarUrl ? (
                <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
              ) : (
                <View className="w-full h-full bg-gray-700 justify-center items-center">
                  <Text className="text-white text-xl font-bold">
                    {friend.avatarInitials}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-white text-xl font-semibold ml-4">
              {friend.name}
            </Text>
          </View>
          
          {isFriendRequest && (
            <View className="flex-row">
              <TouchableOpacity
                className="bg-yellow-600 px-4 py-2 rounded-full mr-2"
                onPress={() => handleAcceptRequest(friend.id)}
                disabled={requestProcessing.accepting || requestProcessing.declining}
              >
                {requestProcessing.accepting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-medium">Accept</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-zinc-700 px-4 py-2 rounded-full"
                onPress={() => handleDeclineRequest(friend.id)}
                disabled={requestProcessing.accepting || requestProcessing.declining}
              >
                {requestProcessing.declining ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-medium">Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    };
  
    // Render search result item
    const renderSearchResult = ({ item }: { item: UserDto }) => {
      const isSending = sendingRequests[item.id] || false;
      const fullName = `${item.firstName} ${item.lastName}`;
      const initials = item.firstName.charAt(0) + item.lastName.charAt(0);
      
      return (
        <View className="flex-row items-center justify-between py-4 border-b border-gray-800">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 justify-center items-center mr-3">
              {item.photo ? (
                <Image source={{ uri: item.photo }} className="w-full h-full" />
              ) : (
                <Text className="text-white text-lg font-bold">{initials}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-medium">{fullName}</Text>
              <Text className="text-gray-400 text-sm">{item.email}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-yellow-600 px-3 py-2 rounded-full"
            onPress={() => handleSendRequest(item.id)}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-medium">Add</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    };
    
    // Render footer for search results list (loading indicator)
    const renderSearchListFooter = () => {
      if (!loadingMoreSearchResults) return null;
      
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#FFC107" />
          <Text className="text-gray-400 mt-2">Loading more results...</Text>
        </View>
      );
    };
  
    return (
      <View className="bg-custom-dark h-full" style={styles.modalContainer}>
        {/* Handle bar */}
        <View className="w-full items-center pt-3 pb-4">
          <View className="w-10 h-2 bg-zinc-600 rounded-full" />
        </View>
  
        <SafeAreaView className="flex-1">
          {loading && friends.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#FFC107" />
              <Text className="text-white mt-4 text-lg">Loading friends...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center px-6">
              <Feather name="alert-circle" size={48} color="#FFC107" />
              <Text className="text-white mt-4 text-lg text-center">{error}</Text>
              <TouchableOpacity
                className="mt-6 bg-yellow-600 px-6 py-3 rounded-full"
                onPress={fetchFriends}
              >
                <Text className="text-white font-bold">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView>
              {/* Friends counter */}
              <Text className="text-white text-4xl font-bold text-center mt-4">
                {friends.length} out of {totalFriends} friends
              </Text>
              <Text className="text-gray-400 text-xl text-center mt-2 mb-6">
                {friendRequests.length > 0
                  ? `You have ${friendRequests.length} pending requests`
                  : "Invite a friend to continue"}
              </Text>
  
              {/* Search bar */}
              <TouchableOpacity 
                className="mx-6 mb-6 flex-row items-center bg-zinc-800 rounded-full px-4 py-3"
                onPress={openSearchModal}
              >
                <Feather name="search" size={22} color="#9CA3AF" />
                <Text className="text-gray-400 text-lg ml-2">
                  Add a new friend
                </Text>
              </TouchableOpacity>
  
              {/* Find friends from other apps */}
              <View className="mx-6 mb-2">
                <View className="flex-row items-center mb-4">
                  <Feather name="search" size={22} color="white" />
                  <Text className="text-white text-xl font-bold ml-2">
                    Find friends from other apps
                  </Text>
                </View>
  
                <View className="bg-zinc-900 rounded-3xl p-6 mb-6">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-2"
                  >
                    {SOCIAL_APPS.map((app) => renderSocialApp(app))}
                  </ScrollView>
                </View>
              </View>
  
              {/* Friend Requests section, show only if there are requests */}
              {friendRequests.length > 0 && (
                <View className="mx-6 mb-6">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="person-add" size={24} color="white" />
                    <Text className="text-white text-xl font-bold ml-2">
                      Friend Requests
                    </Text>
                  </View>
  
                  <View className="bg-zinc-900 rounded-3xl px-4 py-3 divide-y divide-zinc-800">
                    {friendRequests.map((request) => renderFriend(request, true))}
                  </View>
                </View>
              )}
  
              {/* Your Friends section */}
              <View className="mx-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="people" size={24} color="white" />
                  <Text className="text-white text-xl font-bold ml-2">
                    Your Friends
                  </Text>
                </View>
  
                {/* Friends list */}
                {friends.length > 0 ? (
                  <View className="bg-zinc-900 rounded-3xl px-4 py-3 divide-y divide-zinc-800">
                    {friends.map((friend) => renderFriend(friend))}
                  </View>
                ) : (
                  <View className="bg-zinc-900 rounded-3xl px-4 py-8 items-center">
                    <Text className="text-gray-400 text-lg text-center">
                      You don't have any friends yet
                    </Text>
                  </View>
                )}
  
                {/* Show more button - only if there are more friends to load */}
                {friends.length > 0 && friends.length < totalFriends && (
                  <View className="items-center mt-6 mb-4">
                    <TouchableOpacity
                      className="bg-zinc-800 py-3 px-10 rounded-full flex-row items-center"
                      onPress={handleLoadMore}
                    >
                      {loading && page > 1 ? (
                        <ActivityIndicator
                          size="small"
                          color="white"
                          style={{ marginRight: 8 }}
                        />
                      ) : null}
                      <Text className="text-white text-lg font-semibold">
                        {loading && page > 1 ? "Loading..." : "Show more"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
  
              {/* Share your link section */}
              <View className="mx-6 my-4">
                <View className="flex-row items-center mb-4">
                  <Feather name="share" size={22} color="white" />
                  <Text className="text-white text-xl font-bold ml-2">
                    Share your Locket link
                  </Text>
                </View>
  
                <TouchableOpacity className="flex-row items-center bg-zinc-900 rounded-full py-3 px-4 mb-10">
                  <View
                    style={styles.messengerIcon}
                    className="rounded-full justify-center items-center mr-3"
                  >
                    <FontAwesome5
                      name="facebook-messenger"
                      size={28}
                      color="white"
                    />
                  </View>
                  <Text className="text-white text-xl font-semibold">
                    Messenger
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={24}
                    color="white"
                    style={{ marginLeft: "auto" }}
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
        
        {/* Search User Modal */}
        <Modal
          visible={isSearchModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeSearchModal}
        >
          <View className="flex-1 bg-black/95">
            <SafeAreaView className="flex-1">
              <View className="px-4 py-3 flex-row items-center border-b border-gray-800">
                <TouchableOpacity onPress={closeSearchModal} className="pr-3">
                  <AntDesign name="close" size={24} color="white" />
                </TouchableOpacity>
                
                <View className="flex-1 flex-row items-center bg-zinc-800 rounded-full px-4 py-2">
                  <Feather name="search" size={18} color="#9CA3AF" />
                  <TextInput
                    ref={searchInputRef}
                    className="flex-1 ml-2 text-white text-base"
                    placeholder="Search by name or email"
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => handleSearch(true)}
                    returnKeyType="search"
                    autoCapitalize="none"
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Feather name="x" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                
                <TouchableOpacity 
                  className="pl-3" 
                  onPress={() => handleSearch(true)}
                  disabled={!searchQuery.trim() || isSearching}
                >
                  <Text className={`font-medium ${searchQuery.trim() && !isSearching ? 'text-yellow-500' : 'text-gray-500'}`}>
                    Search
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View className="flex-1 px-4">
                {isSearching ? (
                  <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#FFC107" />
                    <Text className="text-white mt-4">Searching users...</Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingVertical: 12 }}
                    ListFooterComponent={renderSearchListFooter}
                    onEndReached={handleLoadMoreSearchResults}
                    onEndReachedThreshold={0.2}
                  />
                ) : searchQuery.trim() ? (
                  <View className="flex-1 justify-center items-center">
                    <Feather name="user-x" size={48} color="#9CA3AF" />
                    <Text className="text-white text-lg mt-4 text-center">
                      No users found matching "{searchQuery}"
                    </Text>
                    <Text className="text-gray-400 text-sm mt-2 text-center">
                      Try a different search term or invite them to join
                    </Text>
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center">
                    <Feather name="users" size={48} color="#9CA3AF" />
                    <Text className="text-white text-lg mt-4 text-center">
                      Search for friends by name or email
                    </Text>
                  </View>
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
      borderTopLeftRadius: 60,
      borderTopRightRadius: 60,
    },
    socialIconContainer: {
      width: 60,
      height: 60,
    },
    messengerIcon: {
      width: 50,
      height: 50,
      backgroundColor: "#006AFF",
    },
    avatar: {
      width: "100%",
      height: "100%",
    },
  });