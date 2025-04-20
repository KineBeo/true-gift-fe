import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, Feather, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DOT_SIZE = 8;
const GRID_PADDING = 4;
const NUM_COLUMNS = 7;
const PHOTO_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 * NUM_COLUMNS) / NUM_COLUMNS;

// Define types for our data
interface Photo {
  id: number;
  month: string;
  day: number;
  uri: string;
}

interface MonthPhotos {
  month: string;
  photos: Photo[];
}

// Mock data for photo grid - this would come from API in actual implementation
const MOCK_PHOTOS: Photo[] = [
  { id: 1, month: "March", day: 5, uri: "https://picsum.photos/id/237/200" },
  { id: 2, month: "March", day: 12, uri: "https://picsum.photos/id/238/200" },
  { id: 3, month: "March", day: 17, uri: "https://picsum.photos/id/239/200" },
  { id: 4, month: "March", day: 23, uri: "https://picsum.photos/id/240/200" },
  { id: 5, month: "March", day: 25, uri: "https://picsum.photos/id/241/200" },
  { id: 6, month: "March", day: 27, uri: "https://picsum.photos/id/242/200" },
  { id: 7, month: "March", day: 30, uri: "https://picsum.photos/id/243/200" },
  { id: 8, month: "April", day: 3, uri: "https://picsum.photos/id/244/200" },
  { id: 9, month: "April", day: 8, uri: "https://picsum.photos/id/245/200" },
  { id: 10, month: "April", day: 15, uri: "https://picsum.photos/id/246/200" },
  { id: 11, month: "April", day: 17, uri: "https://picsum.photos/id/247/200" },
  { id: 12, month: "April", day: 22, uri: "https://picsum.photos/id/248/200" },
];

// Group photos by month
const groupPhotosByMonth = (photos: Photo[]): MonthPhotos[] => {
  const grouped: Record<string, Photo[]> = {};

  photos.forEach((photo) => {
    if (!grouped[photo.month]) {
      grouped[photo.month] = [];
    }
    grouped[photo.month].push(photo);
  });

  return Object.entries(grouped).map(([month, photos]) => ({
    month,
    photos,
  }));
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const monthlyPhotos = groupPhotosByMonth(MOCK_PHOTOS);

  // Generate calendar grid for a month
  const renderCalendarGrid = (month: string, photos: Photo[]) => {
    // Calculate days in month (31 for simplicity, could be dynamic)
    const daysInMonth = 31;
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Map of day number to photo
    const photoMap: Record<number, Photo> = {};
    photos.forEach((photo) => {
      photoMap[photo.day] = photo;
    });

    return (
      <View style={styles.gridContainer} className="mx-2 mb-6">
        <View style={styles.grid}>
          {days.map((day) => {
            const hasPhoto = !!photoMap[day];
            return (
              <View key={`${month}-${day}`} style={styles.gridItem}>
                {hasPhoto ? (
                  <TouchableOpacity className="overflow-hidden rounded-xl">
                    <Image
                      source={{ uri: photoMap[day].uri }}
                      style={styles.photo}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ) : (
                  <View className="items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-gray-400" />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView className="z-10">
        <View className="flex-row justify-between items-center px-4 py-2">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-gray-700 rounded-full items-center justify-center mr-2">
              <Text className="text-white text-xl font-bold">
                {user?.lastName.charAt(0)}
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold">
              {user?.lastName}
            </Text>
          </View>

          <View className="flex-row items-center justify-center gap-4">
            <TouchableOpacity
              onPress={() => router.push("/(app)/profile/friends")}
              className="mr-4"
            >
              <Ionicons name="people" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(app)/profile/setting")}
              className="mr-4"
            >
              <Ionicons name="settings-sharp" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(test)/camera-test")}
            >
              <FontAwesome name="chevron-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Divider */}
        <View className="w-full items-center my-4">
          <View className="w-1 h-10 border-dashed border-l-2 border-gray-500" />
        </View>

        {monthlyPhotos.map(({ month, photos }) => (
          <View key={month}>
            {/* Month header */}
            <View className="mx-4 my-2 bg-gray-900 rounded-xl overflow-hidden">
              <Text className="text-white text-2xl font-bold px-4 py-3">
                {month} 2025
              </Text>
            </View>

            {/* Calendar grid */}
            {renderCalendarGrid(month, photos)}

            {/* Divider */}
            <View className="w-full items-center my-4">
              <View className="w-1 h-10 border-dashed border-l-2 border-gray-500" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  gridItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: GRID_PADDING,
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
  },
});
