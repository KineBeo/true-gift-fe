import React, { useEffect } from "react";
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

const { width } = Dimensions.get("window");

// Define types for our data
interface Friend {
  id: number;
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

// Mock data for friends list
const MOCK_FRIENDS: Friend[] = [
  {
    id: 1,
    name: "Trang Hoàng",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 2,
    name: "nguynn linh",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 3,
    name: "Công Quý nè",
    avatarInitials: "CQ",
  },
];

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

  // Run animation when component mounts
  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

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
      <TouchableOpacity className="p-2">
        <Feather name="x" size={24} color="white" />
      </TouchableOpacity>
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
          <ScrollView>
            {/* Friends counter */}
            <Text className="text-white text-4xl font-bold text-center mt-4">
              6 out of 20 friends
            </Text>
            <Text className="text-gray-400 text-xl text-center mt-2 mb-6">
              Invite a friend to continue
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

            {/* Your Friends section */}
            <View className="mx-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="people" size={24} color="white" />
                <Text className="text-white text-xl font-bold ml-2">
                  Your Friends
                </Text>
              </View>

              {/* Friends list */}
              <View className="bg-zinc-900 rounded-3xl px-4 py-3 divide-y divide-zinc-800">
                {MOCK_FRIENDS.map((friend) => renderFriend(friend))}
              </View>

              {/* Show more button */}
              <View className="items-center mt-6 mb-4">
                <TouchableOpacity className="bg-zinc-800 py-3 px-10 rounded-full">
                  <Text className="text-white text-lg font-semibold">
                    Show more
                  </Text>
                </TouchableOpacity>
              </View>
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
