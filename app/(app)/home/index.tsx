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
  TextInput,
  SafeAreaView,
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
import messagesService from "@/lib/services/messages";
import { homeStyles } from "./styles/homeStyles";
import ChallengeCard from "@/components/ui/challenge/ChallengeCard";
import challengeService, { TodayChallengeDto } from "@/lib/services/challenge";
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
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [challenge, setChallenge] = useState<TodayChallengeDto | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const router = useRouter();
  const [messageText, setMessageText] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeMessageItem, setActiveMessageItem] = useState<string | null>(
    null
  );

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
    // Fetch photos and challenge initially and when user changes
    if (user?.id) {
      fetchAllPhotos();
      fetchTodayChallenge();
    }
  }, [user?.id]);
  
  // Fetch today's challenge (only once on initial load)
  const fetchTodayChallenge = async () => {
    try {
      setLoadingChallenge(true);
      console.log("[Challenge] Initial fetch of today's challenge");
      const todayChallenge = await challengeService.getTodayChallenge();
      
      // Compare with existing challenge if we have one
      if (challenge && challenge.id !== todayChallenge.id) {
        console.log("[Challenge] Received different challenge from server:", todayChallenge.id);
      }
      
      setChallenge(todayChallenge);
    } catch (error) {
      console.error("Error fetching today's challenge:", error);
    } finally {
      setLoadingChallenge(false);
    }
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
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
      setMyPhotos(allPhotos);
      return allPhotos;
    } catch (error) {
      console.error("Error fetching all photos:", error);
      Alert.alert("Error", "Failed to load photos");
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

  const showChallenge = async () => {
    try {
      // If we don't have a challenge yet or it's expired, fetch it
      if (!challenge || new Date(challenge.expiresAt) < new Date()) {
        setLoadingChallenge(true);
        if (user?.id) {
          console.log("[Challenge] Fetching challenge in showChallenge");
          const todayChallenge = await challengeService.getTodayChallenge();
          setChallenge(todayChallenge);
        }
        setLoadingChallenge(false);
      } else {
        console.log("[Challenge] Using cached challenge in showChallenge:", challenge.id);
        
        // If challenge is completed, re-fetch to ensure we have latest state
        // This helps when user completes a challenge from another device/session
        if (challenge.isCompleted) {
          fetchTodayChallenge().catch(err => {
            console.error("Error refreshing completed challenge:", err);
          });
        }
      }
      
      // Show the modal
      setChallengeModalVisible(true);
    } catch (error) {
      console.error("Error fetching today's challenge:", error);
      Alert.alert("Error", "Failed to load today's challenge");
      setLoadingChallenge(false);
    }
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
        <View style={homeStyles.cameraContainer}>
          <Image
            source={{ uri: uri || undefined }}
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
            style={homeStyles.sendButton}
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
        <ChallengeCard challenge={challenge} loading={loadingChallenge} />
        <View style={homeStyles.cameraContainer}>
          <CameraView
            style={homeStyles.camera}
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
            className="bg-zinc-800/80 px-6 py-3 rounded-full flex-row items-center"
          >
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
        <View className="flex-row w-full justify-between px-16 absolute bottom-36 items-center">
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
            onPress={takePicture}
            style={homeStyles.captureButton}
          >
            <View
              style={[
                homeStyles.captureButtonInner,
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

        {/* History and Challenge buttons */}
        <View className="absolute bottom-16 w-full flex-row justify-center items-center space-x-4">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-zinc-800/80 py-4 rounded-[30px] gap-1 mx-4"
            onPress={showHistory}
          >
            <Feather name="image" size={22} color="white" />
            <Text className="text-white font-bold text-[18px]">History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-zinc-800/80 py-4 rounded-[30px] gap-1 mx-4"
            onPress={showChallenge}
          >
            <Feather name="award" size={22} color="white" />
            <Text className="text-white font-bold text-[18px]">Challenge</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const sendMessageAboutPhoto = async (
    userId: number | null | undefined,
    photoURL: string,
    message: string
  ) => {
    if (!userId || !message.trim()) {
      Alert.alert(
        "Error",
        "Cannot send message. Invalid user or empty message."
      );
      return;
    }

    try {
      setSendingMessage(true);

      // Prepare content with photo reference
      const content = `[Photo: ${photoURL}] ${message}`;

      // Send message using the messages service
      await messagesService.sendMessage({
        receiverId: userId,
        content: content,
      });

      // Reset message input and active item
      setMessageText("");
      setActiveMessageItem(null);

      Alert.alert("Success", "Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const renderFeedItem = ({ item }: { item: ExtendedFileDto }) => {
    const imageUrl = filesService.getFileUrl(item.path);
    const isIpfs = isIPFSImage(item.path);
    const isFriendPhoto = item.userId && item.userName;

    return (
      <View style={homeStyles.feedItem}>
        <View className="flex-1 bg-black w-full items-center justify-center">
          <View style={homeStyles.feedCameraContainer}>
            <Image
              source={{ uri: imageUrl }}
              contentFit="cover"
              transition={500}
              style={homeStyles.feedImage}
              cachePolicy={isIpfs ? "memory" : "disk"}
            />
          </View>
          {/* Friend name badge if it's a friend's photo */}
          {isFriendPhoto && (
            <View className="flex-row items-center py-2 px-3 rounded-3xl bg-custom-dark mt-4">
              <Ionicons name="person" size={20} color="white" />
              <Text className="font-bold text-lg ml-2 text-white">
                {item.userName}
              </Text>
            </View>
          )}
        </View>

        {/* Message box for friend photos */}
        {isFriendPhoto && (
          <View style={homeStyles.messageBoxContainer} className="">
            <>
              <View className="flex-row items-center bg-zinc-800 rounded-full px-4 py-2">
                <TextInput
                  className="flex-1 text-gray-300 text-base mr-2 font-bold p-2"
                  placeholder="Send message..."
                  placeholderTextColor="white"
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={200}
                />
                <TouchableOpacity
                  style={homeStyles.messageSendButton}
                  onPress={() =>
                    sendMessageAboutPhoto(item.userId, item.path, messageText)
                  }
                  disabled={sendingMessage || !messageText.trim()}
                >
                  {sendingMessage ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="send" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          </View>
        )}

        {/* Bottom controls */}
        <View className="flex-row w-full justify-between px-16 absolute bottom-16 items-center">
          {/* View details button */}
          <TouchableOpacity
            className="items-center justify-center w-12 h-12"
            // onPress={() => viewPhotoDetail(item)}
          >
            <Ionicons name="grid" size={35} color="white" />
          </TouchableOpacity>

          {/* Like button placeholder */}
          <Pressable style={homeStyles.captureButton}>
            <View
              style={[
                homeStyles.captureButtonInner,
                { backgroundColor: "white" },
              ]}
            />
          </Pressable>

          {/* Share Button */}
          <TouchableOpacity className="items-center justify-center w-12 h-12">
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
        <View style={homeStyles.mainContainer}>
          {loadingPhotos ? (
            <View style={homeStyles.feedLoadingContainer}>
              <ActivityIndicator size="large" color="#FFB800" />
              <Text style={homeStyles.feedLoadingText}>
                Loading your photos...
              </Text>
            </View>
          ) : myPhotos.length === 0 ? (
            <View style={homeStyles.feedEmptyContainer}>
              <Ionicons name="images-outline" size={60} color="#999" />
              <Text style={homeStyles.feedEmptyText}>No photos yet</Text>
              <Text style={homeStyles.feedEmptySubtext}>
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

  const submitChallenge = async () => {
    if (!uri) {
      Alert.alert("Error", "Please take a photo first");
      return;
    }

    setIsSubmittingChallenge(true);

    try {
      const response = await challengeService.submitChallenge(
        uri,
        challenge?.id
      );

      if (response.success) {
        // Update the local challenge with completed status
        if (challenge) {
          setChallenge({
            ...challenge,
            isCompleted: true
          });
        }
        
        setTimeout(() => {
          Alert.alert(
            "Challenge Completed!",
            `Score: ${Math.round(response.score)}%. ${response.message}`,
            [
              {
                text: "See Streak",
                onPress: () => {
                  setChallengeModalVisible(false);
                  setUri(null);
                  router.push("/challenges");
                },
              },
              {
                text: "Close",
                onPress: () => {
                  setChallengeModalVisible(false);
                  setUri(null);
                },
              },
            ]
          );
        }, 500);
      } else {
        Alert.alert(
          "Challenge Failed",
          `Score: ${Math.round(response.score)}%. ${response.message}`,
          [
            {
              text: "Try Again",
              onPress: () => setUri(null),
            },
            {
              text: "Close",
              onPress: () => {
                setChallengeModalVisible(false);
                setUri(null);
              },
              style: "cancel",
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error submitting challenge:", error);
      Alert.alert("Error", "Failed to submit challenge. Please try again.", [
        {
          text: "OK",
          onPress: () => setUri(null),
        },
      ]);
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  const renderChallengeModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={challengeModalVisible}
        onRequestClose={() => setChallengeModalVisible(false)}
      >
        <View style={homeStyles.mainContainer}>
          {loadingChallenge ? (
            <View style={homeStyles.feedLoadingContainer}>
              <ActivityIndicator size="large" color="#FFB800" />
              <Text style={homeStyles.feedLoadingText}>
                Loading today's challenge...
              </Text>
            </View>
          ) : !challenge ? (
            <View style={homeStyles.feedEmptyContainer}>
              <Ionicons name="trophy-outline" size={60} color="#999" />
              <Text style={homeStyles.feedEmptyText}>
                No challenge available
              </Text>
              <Text style={homeStyles.feedEmptySubtext}>
                Check back later for today's challenge
              </Text>
            </View>
          ) : (
            <>
              {!uri ? (
                <View className="flex-1 bg-black w-full items-center justify-center">
                  {/* Challenge Info Banner */}
                  <View className="absolute top-36 w-full">
                    <View className="bg-zinc-800/90 p-5 rounded-[30px]">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-white font-bold text-xl">
                          {challenge.title || "Today's Challenge"}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="flame" size={20} color="#FFB800" />
                          <Text className="text-white ml-1 font-bold">
                            {challenge.currentStreak || 0}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-300">
                        {challenge.description}
                      </Text>
                    </View>
                  </View>

                  {/* Camera View */}
                  <View style={homeStyles.challengeCameraContainer}>
                    <CameraView
                      style={homeStyles.camera}
                      ref={ref}
                      facing={facing}
                      enableTorch={flash}
                    />
                  </View>

                  {/* Bottom controls */}
                  <View className="flex-row w-full justify-between px-16 absolute bottom-36 items-center">
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
                      onPress={takePicture}
                      style={homeStyles.captureButton}
                    >
                      <View style={homeStyles.captureButtonInner} />
                    </Pressable>

                    <Pressable
                      onPress={toggleFacing}
                      className="items-center justify-center w-12 h-12"
                    >
                      <Ionicons name="sync" size={35} color="white" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View className="flex-1 bg-black w-full items-center justify-center">
                  {/* Challenge Info Banner */}
                  <View className="absolute top-36 w-full">
                    <View className="bg-zinc-800/90 p-5 rounded-[30px]">
                      <Text className="text-white font-bold text-xl">
                        {challenge.title || "Today's Challenge"}
                      </Text>
                      <Text className="text-gray-300">
                        {challenge.description}
                      </Text>
                    </View>
                  </View>

                  {/* Image Preview */}
                  <View style={homeStyles.challengeCameraContainer}>
                    <Image
                      source={{ uri }}
                      contentFit="contain"
                      style={{
                        width: Dimensions.get("window").width * 0.975,
                        aspectRatio: 1,
                      }}
                    />
                  </View>

                  {/* Submit or Retake Buttons */}
                  <View className="absolute bottom-36 w-full flex-row justify-center gap-10">
                    <TouchableOpacity
                      className="flex-row items-center bg-zinc-800/80 p-5 rounded-[40px] gap-1"
                      onPress={() => setUri(null)}
                    >
                      <Ionicons name="refresh" size={22} color="white" />
                      <Text className="text-white font-extrabold text-2xl">
                        Retake
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center bg-amber-400 p-5 rounded-[40px] gap-1"
                      onPress={submitChallenge}
                      disabled={isSubmittingChallenge}
                    >
                      {isSubmittingChallenge ? (
                        <ActivityIndicator size="small" color="black" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-sharp" size={22} color="black" />
                          <Text className="text-black font-extrabold text-2xl">
                            Submit
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Close button */}
              <View className="absolute top-16 left-0 mt-4">
                <Pressable
                  className="bg-zinc-800/80 p-3 rounded-full flex-row items-center"
                  onPress={() => {
                    setChallengeModalVisible(false);
                    setUri(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      {uri ? renderPicture() : permission?.granted ? renderCamera() : null}
      {renderFeedModal()}
      {renderChallengeModal()}
    </View>
  );
}
