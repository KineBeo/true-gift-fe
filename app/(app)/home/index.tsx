import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
  StatusBar as RNStatusBar,
  Platform,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import filesService, { FileDto } from "@/lib/services/files";
import * as FileSystem from "expo-file-system";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GRID_SPACING = 4;
const NUM_COLUMNS = 3;
const PHOTO_SIZE =
  (SCREEN_WIDTH - GRID_SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

// Function to group photos by date (month and year)
const groupPhotosByDate = (photos: FileDto[]) => {
  const groups: { [key: string]: FileDto[] } = {};

  photos.forEach((photo) => {
    if (!photo.createdAt) return;

    const date = new Date(photo.createdAt);
    const monthYear = `${date.toLocaleString("default", {
      month: "long",
    })} ${date.getFullYear()}`;

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }

    groups[monthYear].push(photo);
  });

  // Convert to array format for section list
  return Object.keys(groups).map((date) => ({
    title: date,
    data: groups[date],
  }));
};

// Helper function to detect IPFS-stored images
const isIPFSImage = (path: string): boolean => {
  if (!path) return false;

  // Check for direct IPFS CID format (no slashes and starts with typical IPFS prefixes)
  if (
    !path.includes("/") &&
    (path.startsWith("Qm") ||
      path.startsWith("bafy") ||
      path.startsWith("bafk") ||
      !!path.match(/^[a-zA-Z0-9]{46,59}$/))
  ) {
    return true;
  }

  // Check for URLs containing IPFS gateways
  if (
    path.includes("/ipfs/") ||
    path.includes("gateway.pinata.cloud") ||
    path.includes("mypinata.cloud")
  ) {
    return true;
  }

  return false;
};

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface ExtendedFileDto extends FileDto {
  userId?: number | null;
  userName?: string | null;
}

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);
  const [flash, setFlash] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null);
  const [myPhotos, setMyPhotos] = useState<FileDto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [groupedPhotos, setGroupedPhotos] = useState<
    { title: string; data: FileDto[] }[]
  >([]);
  const [selectedPhoto, setSelectedPhoto] = useState<FileDto | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/welcome");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Group photos whenever myPhotos changes
    if (myPhotos.length > 0) {
      setGroupedPhotos(groupPhotosByDate(myPhotos));
    }
  }, [myPhotos]);

  useEffect(() => {
    fetchAllPhotos();
  }, []);

  // const openHistoryModal = () => {
  //   fetchMyPhotos();
  //   router.push("/home/history");
  // };

  const viewPhotoDetail = (photo: FileDto) => {
    setSelectedPhoto(photo);
    router.push({
      pathname: "/home/photo-detail",
      params: { photo: JSON.stringify(photo) },
    });
  };
  const fetchMyPhotos = async (): Promise<ExtendedFileDto[]> => {
    try {
      const response = await filesService.getMyPhotos();
      if (response && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching photos:", error);
      Alert.alert("Error", "Failed to load your photos");
      return [];
    }
  };

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

  const fetchAllPhotos = async (): Promise<ExtendedFileDto[]> => {
    try {
      setLoadingPhotos(true);
      const myPhotos = await fetchMyPhotos();
      const friendsPhotos = await fetchFriendsPhotos();
      const allPhotos = [...myPhotos, ...friendsPhotos];
      allPhotos.sort((a: ExtendedFileDto, b: ExtendedFileDto) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      setMyPhotos(allPhotos);
      return allPhotos;
    } catch (error) {
      console.error("Error fetching all photos:", error);
      return [];
    } finally {
      setLoadingPhotos(false);
    }
  };

  const onRefreshPhotos = useCallback(async () => {
    setRefreshing(true);
    await fetchAllPhotos();
    setRefreshing(false);
  }, []);

  const showHistory = () => {
    // fetchMyPhotos();
    fetchAllPhotos();
    setFeedModalVisible(true);
  };

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-800">
        <Text className="text-white text-center mb-4">
          We need your permission to use the camera
        </Text>
        <Pressable
          className="bg-amber-400 py-3 px-6 rounded-full"
          onPress={requestPermission}
        >
          <Text className="text-black font-semibold">Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    setUri(photo?.uri ?? null);
  };

  const recordVideo = async () => {
    if (recording) {
      setRecording(false);
      ref.current?.stopRecording();
      return;
    }
    setRecording(true);
    const video = await ref.current?.recordAsync();
    // console.log({ video });
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((prev) => !prev);
  };

  const selectFriend = () => {
    // For now, just select a placeholder friend ID
    // In a real app, you would show a friend picker modal
    setSelectedFriend(1);
    Alert.alert("Friend Selected", "Photo will be sent to your friend");
  };

  const sendPicture = async () => {
    if (!uri) {
      Alert.alert("Error", "No photo to send");
      return;
    }
    setSending(true);
    try {
    
      // Check if the URI is valid for upload - must be a local file:// or content:// URI
      if (!uri.startsWith("file://") && !uri.startsWith("content://")) {
        console.warn(
          `URI format might not be compatible: ${uri.substring(0, 20)}...`
        );
      }

      // Try getting file info if possible
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error("File does not exist at the specified URI");
        }
      } catch (fileInfoError) {
        console.warn("Unable to verify file info:", fileInfoError);
      }

      // Upload the photo - always use the default 'message' type
      // If no friend is selected, we'll just upload without specifying a recipient
      const response = await filesService.uploadPhoto(uri, {
        type: "message",
        toUserId: selectedFriend || undefined,
      });

      console.log("Upload response:", JSON.stringify(response));

      if (response.success) {
        Alert.alert("Success", "Photo uploaded successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Reset the camera view
              setUri(null);
              setSending(false);

              // Refresh the photo history to show the new photo
              fetchMyPhotos();
            },
          },
        ]);
      } else {
        console.error("Upload failed with response:", JSON.stringify(response));
        throw new Error(response.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error sending photo:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.message : "Unknown error"
      );

      // More user-friendly error message
      Alert.alert(
        "Upload Failed",
        `Unable to upload your photo. ${
          error instanceof Error ? error.message : "Please try again later."
        }`,
        [
          {
            text: "OK",
            onPress: () => {
              setSending(false);
            },
          },
        ]
      );
    } finally {
      // Ensure sending state is reset even if there's an uncaught error
      setTimeout(() => {
        if (sending) {
          setSending(false);
        }
      }, 5000);
    }
  };

  const downloadPhoto = () => {
    if (!uri) return;

    // This would save the photo to the device's gallery
    // For now, just show an alert
    Alert.alert("Photo Saved", "Photo has been saved to your device");
  };

  const renderPicture = () => {
    return (
      <View className="flex-1 bg-black w-full items-center justify-center">
        {/* Take a picture */}
        <View style={styles.cameraContainer}>
          <Image
            source={{ uri }}
            contentFit="contain"
            style={{
              width: Dimensions.get("window").width * 0.975,
              aspectRatio: 1,
            }}
          />
        </View>

        {/* Friend count indicator */}
        <View className="absolute top-16 w-full flex-row justify-between px-4 m-4">
          <Pressable
            className="bg-zinc-800/80 p-4 rounded-full"
            onPress={() => router.push("/profile")}
          >
            <Ionicons name="person" size={22} color="white" />
          </Pressable>

          <Pressable
            className="bg-zinc-800/80 px-6 py-3 rounded-full flex-row items-center"
            onPress={selectFriend}
          >
            <Ionicons name="people" size={22} color="white" />
            <Text className="text-white ml-2 font-extrabold text-xl">
              Send to ...
            </Text>
          </Pressable>

          <Pressable
            className="bg-zinc-800/80 p-4 rounded-full"
            onPress={downloadPhoto}
          >
            <Ionicons name="download-outline" size={24} color="white" />
          </Pressable>
        </View>

        {/* Bottom Control */}
        <View className="flex-row w-full justify-between px-16 absolute bottom-52 items-center">
          <Pressable
            onPress={() => setUri(null)}
            className="items-center justify-center w-12 h-12"
          >
            <Entypo name={"cross"} size={40} color="white" />
          </Pressable>

          <Pressable
            onPress={sendPicture}
            disabled={sending}
            style={styles.sendButton}
          >
            {sending ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Ionicons name="paper-plane-outline" size={40} color="white" />
            )}
          </Pressable>

          <Pressable className="items-center justify-center w-12 h-12">
            <Ionicons name="sparkles-outline" size={32} color="white" />
          </Pressable>
        </View>

        {/* Send to friends */}
        <View className="absolute bottom-32 w-full items-center">
          <Pressable
            className="flex-row items-center bg-zinc-800/80 py-2 px-6 rounded-full"
            onPress={selectFriend}
          >
            <Feather name="image" size={22} color="white" />
            <Text className="text-white ml-2 font-bold text-2xl">
              {selectedFriend ? "Friend Selected" : "Select Friend"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderCamera = () => {
    return (
      <View className="flex-1 bg-black w-full items-center justify-center">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            ref={ref}
            mode={mode}
            facing={facing}
            enableTorch={flash}
          />
        </View>

        {/* Friend count indicator */}
        <View className="absolute top-16 w-full flex-row justify-between px-4 m-4">
          <TouchableOpacity
            className="bg-zinc-800/80 p-4 rounded-full"
            onPress={() => router.push("/profile")}
          >
            <Ionicons name="person" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
          onPress={() => router.push("/(app)/home/friends")}
          className="bg-zinc-800/80 px-6 py-3 rounded-full flex-row items-center">
            <Ionicons name="people" size={22} color="white" />
            <Text className="text-white ml-2 font-extrabold text-xl">
              1 Friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/message")}
            className="bg-zinc-800/80 p-4 rounded-full"
          >
            <Ionicons name="chatbubble" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View className="flex-row w-full justify-between px-16 absolute bottom-52 items-center">
          <Pressable
            onPress={toggleFlash}
            className="items-center justify-center w-12 h-12"
          >
            <Ionicons
              name={flash ? "flash" : "flash-off"}
              size={35}
              color="#ffb800"
            />
          </Pressable>

          {/* Capture button */}
          <Pressable
            onPress={mode === "picture" ? takePicture : recordVideo}
            style={styles.captureButton}
          >
            <View
              style={[
                styles.captureButtonInner,
                recording && { backgroundColor: "red" },
              ]}
            />
          </Pressable>

          <Pressable
            onPress={toggleFacing}
            className="items-center justify-center w-12 h-12"
          >
            <Ionicons name="sync" size={35} color="white" />
          </Pressable>
        </View>

        {/* History button */}
        <View className="absolute bottom-32 w-full flex-row justify-center space-x-4">
          <TouchableOpacity
            className="flex-row items-center bg-zinc-800/80 py-2 px-6 rounded-full"
            onPress={showHistory}
          >
            <Feather name="image" size={22} color="white" />
            <Text className="text-white ml-2 font-bold text-2xl">History</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFeedItem = ({ item }: { item: FileDto }) => {
    const imageUrl = filesService.getFileUrl(item.path);
    const isIpfs = isIPFSImage(item.path);

    return (
      <View style={styles.feedItem}>
        <View className="flex-1 bg-black w-full items-center justify-center">
          <View style={styles.feedCameraContainer}>
            <Image
              source={{ uri: imageUrl }}
              contentFit="cover"
              transition={500}
              style={styles.feedImage}
              cachePolicy={isIpfs ? "memory" : "disk"}
            />
          </View>
        </View>

        {/* Bottom controls */}
        <View className="flex-row w-full justify-between px-16 absolute bottom-16 items-center">
          {/* History Button */}
          <TouchableOpacity
            // onPress={toggleFlash}
            className="items-center justify-center w-12 h-12"
          >
            <Ionicons name={"grid"} size={35} color="white" />
          </TouchableOpacity>

          {/* Capture button */}
          <Pressable
            // onPress={mode === "picture" ? takePicture : recordVideo}
            style={styles.captureButton}
          >
            <View
              style={[
                styles.captureButtonInner,
                recording && { backgroundColor: "red" },
              ]}
            />
          </Pressable>

          {/* Share Button */}
          <TouchableOpacity
            // onPress={toggleFacing}
            className="items-center justify-center w-12 h-12"
          >
            <Ionicons name="share-social" size={35} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFeedModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={feedModalVisible}
        onRequestClose={() => setFeedModalVisible(false)}
      >
        <View style={styles.mainContainer}>
          {loadingPhotos ? (
            <View style={styles.feedLoadingContainer}>
              <ActivityIndicator size="large" color="#FFB800" />
              <Text style={styles.feedLoadingText}>Loading your photos...</Text>
            </View>
          ) : myPhotos.length === 0 ? (
            <View style={styles.feedEmptyContainer}>
              <Ionicons name="images-outline" size={60} color="#999" />
              <Text style={styles.feedEmptyText}>No photos yet</Text>
              <Text style={styles.feedEmptySubtext}>
                Take your first photo to see it here
              </Text>
            </View>
          ) : (
            <FlatList
              data={myPhotos}
              keyExtractor={(item) => item.id}
              renderItem={renderFeedItem}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              snapToInterval={SCREEN_HEIGHT}
              snapToAlignment="start"
              decelerationRate="fast"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefreshPhotos}
                  tintColor="#FFB800"
                  colors={["#FFB800"]}
                />
              }
            />
          )}

          {/* Feed control buttons */}
          <View className="absolute top-16 w-full flex-row justify-between px-8 mt-4">
            {/* <Pressable
              className="bg-zinc-800/80 p-4 rounded-full"
              onPress={() => router.push("/profile")}
            >
              <Ionicons name="person" size={22} color="white" />
            </Pressable> */}

            <Pressable
              className="bg-zinc-800/80 px-6 py-3 rounded-full flex-row items-center"
              onPress={() => setFeedModalVisible(false)}
            >
              <Ionicons name="camera" size={22} color="white" />
              <Text className="text-white ml-2 font-extrabold text-xl">
                Camera
              </Text>
            </Pressable>

            {/* <Pressable
              className="bg-zinc-800/80 p-4 rounded-full"
              onPress={() => router.push("/message")}
            >
              <Ionicons name="chatbubble" size={22} color="white" />
            </Pressable> */}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {uri ? renderPicture() : renderCamera()}
        {renderFeedModal()}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    width: Dimensions.get("window").width * 0.975,
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 50,
    marginBottom: 150,
  },
  feedCameraContainer: {
    width: Dimensions.get("window").width * 0.975,
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 50,
  },
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  captureButton: {
    width: 75,
    height: 75,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: "#FFB800",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  sendButton: {
    width: 95,
    height: 95,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: "#FFB800",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "gray",
  },
  captureButtonInner: {
    width: 55,
    height: 55,
    borderRadius: 50,
    backgroundColor: "white",
  },
  // Feed specific styles
  feedItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000",
  },
  feedImage: {
    width: "100%",
    height: "100%",
  },
  feedInfo: {
    position: "absolute",
    bottom: 100,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 12,
    maxWidth: "70%",
  },
  feedUsername: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  feedTimestamp: {
    color: "#ccc",
    fontSize: 14,
  },
  feedIpfsBadge: {
    position: "absolute",
    right: 15,
    top: 60,
    backgroundColor: "rgba(0, 102, 204, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  feedLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  feedLoadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  feedEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  feedEmptyText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
  },
  feedEmptySubtext: {
    color: "#ccc",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  feedBackButton: {
    position: "absolute",
    top: 60,
    left: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 20,
  },
  feedBackText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
});
