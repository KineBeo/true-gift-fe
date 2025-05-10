import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StatusBar as RNStatusBar,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import filesService, { FileDto } from "@/lib/services/files";
import { homeStyles } from "./styles/homeStyles";
import { imageHistoryStyles } from "./styles/imageHistoryStyles";
import IconButton from "@/components/ui/common/IconButton";
import IconOnlyButton from "@/components/ui/common/IconOnlyButton";
import { useAuthStore } from "@/lib/stores/auth-store";
import PhotoFilterPopover, { FilterOption } from "@/components/ui/photo/PhotoFilterPopover";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SPACING = 2;
const NUM_COLUMNS = 3;
const PHOTO_SIZE =
  (SCREEN_WIDTH - GRID_SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface ExtendedFileDto extends FileDto {
  userId?: number | null;
  userName?: string | null;
}

type PhotoFilter = "all" | "friends" | "mine";

// Additional local styles for items not included in the main styles file
const localStyles = StyleSheet.create({
  myPhotoIndicator: {
    position: "absolute",
    left: 5,
    top: 5,
    backgroundColor: "#FFB800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  myPhotoText: {
    color: "black",
    fontSize: 8,
    fontWeight: "bold",
  },
});

export default function ImageHistory() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<ExtendedFileDto[]>([]);
  const [myPhotos, setMyPhotos] = useState<ExtendedFileDto[]>([]);
  const [friendPhotos, setFriendPhotos] = useState<ExtendedFileDto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>("all");

  useEffect(() => {
    fetchAllPhotos();
  }, []);

  // Effect to filter photos based on active filter
  useEffect(() => {
    switch (activeFilter) {
      case "all":
        setPhotos([...myPhotos, ...friendPhotos]);
        break;
      case "friends":
        setPhotos(friendPhotos);
        break;
      case "mine":
        setPhotos(myPhotos);
        break;
    }
  }, [activeFilter, myPhotos, friendPhotos]);

  // Fetch user's own photos
  const fetchMyPhotos = async (): Promise<ExtendedFileDto[]> => {
    try {
      const response = await filesService.getMyPhotos();
      if (response && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching my photos:", error);
      Alert.alert("Error", "Failed to load your photos");
      return [];
    }
  };

  // Fetch friends' photos
  const fetchFriendsPhotos = async (): Promise<ExtendedFileDto[]> => {
    try {
      const response = await filesService.getAllFriendsPhotos();
      if (response && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching friends photos:", error);
      Alert.alert("Error", "Failed to load your friends' photos");
      return [];
    }
  };

  // Fetch all photos (both user's and friends')
  const fetchAllPhotos = async () => {
    try {
      setLoadingPhotos(true);

      // Fetch both types of photos in parallel
      const [userPhotos, friendsPhotos] = await Promise.all([
        fetchMyPhotos(),
        fetchFriendsPhotos(),
      ]);

      // Sort by date, newest first
      const sortByDate = (a: ExtendedFileDto, b: ExtendedFileDto) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime();

      const sortedUserPhotos = [...userPhotos].sort(sortByDate);
      const sortedFriendPhotos = [...friendsPhotos].sort(sortByDate);

      setMyPhotos(sortedUserPhotos);
      setFriendPhotos(sortedFriendPhotos);

      // Set photos based on current filter
      if (activeFilter === "all") {
        setPhotos(
          [...sortedUserPhotos, ...sortedFriendPhotos].sort(sortByDate)
        );
      } else if (activeFilter === "friends") {
        setPhotos(sortedFriendPhotos);
      } else {
        setPhotos(sortedUserPhotos);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
      Alert.alert("Error", "Failed to load photos");
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Refresh photos when pulling down
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllPhotos();
    setRefreshing(false);
  }, [activeFilter]);

  // Navigate to photo detail page
  const viewPhotoDetail = (photo: FileDto) => {
    try {
      router.push({
        pathname: "/home/photo-detail",
        params: {
          photo: JSON.stringify(photo),
        },
      });
    } catch (error) {
      console.error("Error navigating to photo detail:", error);
      Alert.alert("Error", "Could not open photo details");
    }
  };

  // Render each photo item in grid
  const renderPhotoItem = ({ item }: { item: ExtendedFileDto }) => {
    const imageUrl = filesService.getFileUrl(item.path);
    const isMyPhoto = item.userId === user?.id;

    return (
      <TouchableOpacity
        style={imageHistoryStyles.photoItem}
        onPress={() => viewPhotoDetail(item)}
        activeOpacity={0.8}
      >
        {failedImages[item.id] ? (
          <View
            style={[
              imageHistoryStyles.thumbnail,
              imageHistoryStyles.fallbackContainer,
            ]}
          >
            <Feather name="image" size={24} color="#999" />
            <Text style={imageHistoryStyles.fallbackText}>Image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={imageHistoryStyles.thumbnail}
            contentFit="cover"
            transition={200}
            onError={() => {
              console.log(
                `Failed to load image: ${item.id}, URL: ${imageUrl}`
              );
              setFailedImages((prev) => ({ ...prev, [item.id]: true }));
            }}
          />
        )}
        {isMyPhoto && (
          <View style={localStyles.myPhotoIndicator}>
            <Text style={localStyles.myPhotoText}>ME</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Empty state component
  const renderEmptyState = () => (
    <View style={imageHistoryStyles.emptyContainer}>
      <Feather name="camera-off" size={48} color="#999" />
      <Text style={imageHistoryStyles.emptyText}>
        {activeFilter === "mine"
          ? "You haven't taken any photos yet"
          : activeFilter === "friends"
          ? "No friend photos found"
          : "No photos found"}
      </Text>
      <Text style={imageHistoryStyles.emptySubtext}>
        {activeFilter === "mine"
          ? "Take photos to see them here"
          : activeFilter === "friends"
          ? "Photos your friends take will appear here"
          : "Take photos or wait for friends to share theirs"}
      </Text>
    </View>
  );

  // Handle filter change
  const handleFilterChange = (filter: FilterOption) => {
    setActiveFilter(filter);
  };

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <StatusBar style="light" />

      {/* Header - Friend count indicator */}
      <View className="absolute top-16 w-full flex-row justify-between px-4 m-4">
        <IconOnlyButton
          iconName="person"
          iconSize={25}
          iconColor="white"
          routePath="/profile"
        />

        <PhotoFilterPopover 
          activeFilter={activeFilter} 
          onSelectFilter={handleFilterChange} 
          friendCount={friendPhotos.length}
        />

        <IconOnlyButton
          iconName="chatbubble"
          iconSize={25}
          iconColor="white"
          routePath="/message"
        />
      </View>

      {/* Grid of Photos */}
      <View className="flex-1 top-40 absolute items-center justify-center w-full bg-black">
        {loadingPhotos && photos.length === 0 ? (
          <View style={imageHistoryStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB800" />
            <Text style={imageHistoryStyles.loadingText}>
              Loading photos...
            </Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            contentContainerStyle={imageHistoryStyles.gridContainer}
            columnWrapperStyle={imageHistoryStyles.photoGrid}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPhotoItem}
            numColumns={3}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFB800"
                colors={["#FFB800"]}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>

      {/* Bottom controls - with Capture button from home */}
      <View className="flex-row w-full justify-between px-16 absolute bottom-20 items-center">
        <TouchableOpacity
          style={imageHistoryStyles.controlButton}
          onPress={() => {
            /* placeholder */
          }}
        >
          <Ionicons name="heart" size={35} color="white" />
        </TouchableOpacity>

        {/* Capture button */}
        <Pressable
          style={homeStyles.captureButton}
          onPress={() => router.push("/home")}
        >
          <View style={[homeStyles.captureButtonInner]} />
        </Pressable>

        <TouchableOpacity
          style={imageHistoryStyles.controlButton}
          onPress={() => {
            /* placeholder */
          }}
        >
          <Ionicons name="share-social" size={35} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
