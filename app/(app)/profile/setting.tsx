import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  FontAwesome,
  MaterialIcons,
  Entypo,
} from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

export default function Setting() {
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

  const renderSettingItem = (
    icon: JSX.Element,
    title: string,
    rightContent: JSX.Element | null = null,
    onPress: () => void = () => {}
  ) => (
    <TouchableOpacity
      className="flex-row items-center justify-between px-4 py-4"
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-zinc-700 rounded-full items-center justify-center mr-4">
          {icon}
        </View>
        <Text className="text-white text-xl font-bold">{title}</Text>
      </View>
      {rightContent}
    </TouchableOpacity>
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
        <View className="w-full items-center pt-3 pb-4">
          <View className="w-10 h-2 bg-zinc-600 rounded-full" />
        </View>

        <Text className="text-gray-300 text-2xl font-extrabold text-center mb-6">
          Settings
        </Text>

        <ScrollView>
          {/* Customize Section */}
          <View className="mb-6">
            <View className="flex-row items-center px-5 mb-2">
              <Ionicons
                name="color-palette-outline"
                size={24}
                color="#9CA3AF"
              />
              <Text className="text-gray-400 text-xl font-extrabold ml-2">
                Customize
              </Text>
            </View>

            <View className="bg-zinc-800 mx-3 rounded-3xl overflow-hidden">
              {renderSettingItem(
                <Ionicons name="apps" size={24} color="white" />,
                "App icon",
                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-yellow-400 rounded-full mr-2" />
                  <Text className="text-gray-400 text-lg mr-2">Gold</Text>
                  <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
                </View>
              )}

              {renderSettingItem(
                <Ionicons name="camera-outline" size={24} color="white" />,
                "Camera theme",
                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-yellow-400 rounded-full mr-2" />
                  <Text className="text-gray-400 text-lg mr-2">Gold</Text>
                  <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
                </View>
              )}

              {renderSettingItem(
                <FontAwesome5 name="fire" size={24} color="white" />,
                "Streak on widget",
                <View className="w-14 h-7 bg-yellow-400 rounded-full flex-row items-center px-0.5">
                  <View
                    className="w-6 h-6 bg-white rounded-full"
                    style={{ marginLeft: "auto" }}
                  />
                </View>
              )}
            </View>
          </View>

          {/* General Section */}
          <View className="mb-6">
            <View className="flex-row items-center px-5 mb-2">
              <Ionicons name="person-outline" size={24} color="#9CA3AF" />
              <Text className="text-gray-400 text-xl font-extrabold ml-2">
                General
              </Text>
            </View>

            <View className="bg-zinc-800 mx-3 rounded-3xl overflow-hidden">
              {renderSettingItem(
                <FontAwesome name="tag" size={24} color="white" />,
                "Edit name",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}

              {renderSettingItem(
                <FontAwesome5 name="birthday-cake" size={22} color="white" />,
                "Edit birthday",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}

              {renderSettingItem(
                <Feather name="phone" size={24} color="white" />,
                "Change phone number",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}

              {renderSettingItem(
                <MaterialIcons name="email" size={24} color="white" />,
                "Change email address",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}

              {renderSettingItem(
                <Ionicons name="add-circle-outline" size={24} color="white" />,
                "How to add the widget",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}

              {renderSettingItem(
                <FontAwesome5 name="dollar-sign" size={24} color="white" />,
                "Restore purchases",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}
            </View>
          </View>

          {/* Privacy & Safety Section */}
          <View className="mb-6">
            <View className="flex-row items-center px-5 mb-2">
              <Feather name="lock" size={24} color="#9CA3AF" />
              <Text className="text-gray-400 text-xl font-extrabold ml-2">
                Privacy & Safety
              </Text>
            </View>

            <View className="bg-zinc-800 mx-3 rounded-3xl overflow-hidden">
              {renderSettingItem(
                <Feather name="slash" size={24} color="white" />,
                "Blocked accounts",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}
            </View>
          </View>

          <View className="mb-20">
            <View className="flex-row items-center px-5 mb-2">
              <Feather name="lock" size={24} color="#9CA3AF" />
              <Text className="text-gray-400 text-xl font-extrabold ml-2">
                Danger Zone
              </Text>
            </View>

            <View className="bg-zinc-800 mx-3 rounded-3xl overflow-hidden">
              {renderSettingItem(
                <Feather name="slash" size={24} color="white" />,
                "Delete Account",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}
              {renderSettingItem(
                <Feather name="slash" size={24} color="white" />,
                "Sign out",
                <FontAwesome name="chevron-right" size={18} color="#9CA3AF" />
              )}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
});
