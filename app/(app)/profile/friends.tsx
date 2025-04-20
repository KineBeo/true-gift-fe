import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import {
  Feather,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import friendsService, { FriendDto } from "../../../lib/services/friends";
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

export default function FriendsScreen() {
  const router = useRouter();
  const translateY = useSharedValue(1000);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [totalFriends, setTotalFriends] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

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
        avatarInitials: "??"
      };
    }

    const fullName = `${userInfo.firstName} ${userInfo.lastName}`;
    const avatarInitials = userInfo.firstName.charAt(0) + userInfo.lastName.charAt(0);

    return {
      id: friendData.id,
      name: fullName,
      avatarUrl: userInfo.photo,
      avatarInitials: avatarInitials
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
        includeRelations: true
      });
      
      console.log("Current user ID:", useAuthStore.getState().user?.id);
      const formattedFriends = response.data.map(formatFriend);
      console.log("Formatted friends:", formattedFriends);
      
      setFriends(formattedFriends);
      setTotalFriends(response.total);
      
      // Fetch pending friend requests
      const requestsResponse = await friendsService.getFriendRequests({
        page: 1,
        limit: 5
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
      setPage(prevPage => prevPage + 1);
    }
  };

  // Remove a friend
  // const handleRemoveFriend = async (friendId: string | number) => {
  //   try {
  //     // Only proceed if the ID is a string (format from backend)
  //     if (typeof friendId === 'string') {
  //       await friendsService.removeFriend(friendId);
  //       // Remove friend from state
  //       setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
  //       setTotalFriends(prev => prev - 1);
  //     }
  //   } catch (err) {
  //     console.error("Error removing friend:", err);
  //     setError("Failed to remove friend. Please try again.");
  //   }
  // };

  // Run animation when component mounts and fetch data
  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
    
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
        includeRelations: true
      });

      // Append new friends to existing list
      setFriends(prev => [...prev, ...response.data.map(formatFriend)]);
    } catch (err) {
      console.error("Error loading more friends:", err);
    }
  };

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

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
  const renderFriend = (friend: Friend) => (
    <View
      key={friend.id}
      className="flex-row items-center justify-between py-3 px-2"
    >
      <View className="flex-row items-center">
        <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400">
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
      {/* <TouchableOpacity 
        className="p-2"
        onPress={() => handleRemoveFriend(friend.id)}
      >
        <Feather name="x" size={24} color="white" />
      </TouchableOpacity> */}
    </View>
  );

  return (
    <View className="flex-1 bg-black/70 justify-end">
      <StatusBar barStyle="light-content" />

      {/* Close area - tap to dismiss */}
      <TouchableOpacity
        className="absolute top-0 left-0 right-0 bottom-0"
        onPress={handleClose}
        activeOpacity={1}
      />

      <Animated.View
        style={[styles.modalContainer, animatedStyles]}
        className="bg-gray-900 rounded-t-3xl h-5/6"
      >
        {/* Handle bar */}
        <View className="w-full items-center pt-3 pb-2">
          <View className="w-10 h-1 bg-zinc-600 rounded-full" />
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
              <TouchableOpacity className="mx-6 mb-6 flex-row items-center bg-zinc-800 rounded-full px-4 py-3">
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
                    {friendRequests.map(request => renderFriend(request))}
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
                    {friends.map(friend => renderFriend(friend))}
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
                        <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
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
