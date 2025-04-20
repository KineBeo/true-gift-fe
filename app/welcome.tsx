import {
  View,
  Text,
  Image,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../components/ui/Button";
import { useMemo } from "react";
import { Feather } from "@expo/vector-icons";

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const iconSize = Math.min(width * 0.15, 50);
  const gridWidth = Math.min(width * 0.6, 220);

  // Memoize the header content to avoid unnecessary re-renders
  const headerContent = useMemo(
    () => (
      <View className="flex-1 items-center justify-center">
        <View
          style={{ width: gridWidth, height: gridWidth * 1.5 }}
          className="relative"
        >
          {/* Phone outline */}
          <View className="w-full h-full border-4 border-gray-400 rounded-3xl relative">
            {/* Dark background representing phone screen */}
            <View className="absolute inset-0 m-1 rounded-2xl bg-black" />

            {/* App Grid */}
            <View className="absolute inset-0 justify-center items-center">
              <View
                className="flex-row flex-wrap justify-center items-center"
                style={{ width: gridWidth * 0.85 }}
              >
                {/* Generate a 3x3 grid of app icons */}
                {[...Array(9)].map((_, index) => {
                  const isCenterIcon = index === 4;
                  return (
                    <View
                      key={index}
                      style={{
                        width: iconSize,
                        height: iconSize,
                        margin: iconSize / 10,
                        borderRadius: 8,
                        borderWidth: isCenterIcon ? 2 : 0,
                        borderColor: isCenterIcon ? "#F59E0B" : "transparent",
                        overflow: "hidden",
                        backgroundColor: isCenterIcon
                          ? "transparent"
                          : "#6B7280",
                      }}
                    >
                      {isCenterIcon && (
                        <Image
                          source={{
                            uri: "https://randomuser.me/api/portraits/men/32.jpg",
                          }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </View>
    ),
    [gridWidth, iconSize]
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Main Container */}
      <View className="flex-1 justify-between items-center px-8 pb-20">
        {/* Header with Phone Illustration */}
        {headerContent}

        {/* Bottom Content */}
        <View className="w-full">
          {/* Logo and App Name */}
          <View className="items-center space-y-4 py-9">
            <View
              className="bg-amber-400 rounded-2xl items-center justify-center"
              style={{ width: 60, height: 60 }}
            >
              <Text className="text-3xl">❤️</Text>
            </View>
            <Text className="text-white text-4xl font-bold">TrueGift</Text>
          </View>

          {/* Tagline */}
          <Text className="text-gray-400 text-xl text-center font-bold pb-6">
            Live pics from your friends,{"\n"}
            on your home screen
          </Text>

          {/* Buttons */}
          <View className="w-full space-y-10 items-center justify-center">
            {/* Create account button */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up")}
              className="bg-amber-400 py-4 rounded-full items-center justify-center w-2/3"
            >
              <Text className="text-black font-extrabold text-xl">
                Create an account
              </Text>
            </TouchableOpacity>

            {/* Sign in text button */}
            <TouchableOpacity onPress={() => router.push("/(test)/camera-test")}>
              <Text className="text-white text-xl font-extrabold text-center pt-6">
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
