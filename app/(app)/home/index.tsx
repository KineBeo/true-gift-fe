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
import ChallengeModal from "@/components/ui/challenge/ChallengeModal";
import challengeService, { TodayChallengeDto } from "@/lib/services/challenge";
import CameraViewComponent from "@/components/ui/camera/CameraView";
import PicturePreview from "@/components/ui/camera/PicturePreview";
import FeedModal from "@/components/ui/feed/FeedModal";

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

  const submitChallenge = async (challengePhotoUri: string) => {
    setIsSubmittingChallenge(true);

    try {
      const response = await challengeService.submitChallenge(
        challengePhotoUri,
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
                  router.push("/challenges");
                },
              },
              {
                text: "Close",
                onPress: () => {
                  setChallengeModalVisible(false);
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
              onPress: () => {},
            },
            {
              text: "Close",
              onPress: () => {
                setChallengeModalVisible(false);
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
        },
      ]);
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      
      {/* Main Content - Either Picture Preview or Camera View */}
      {uri ? (
        <PicturePreview
          uri={uri}
          homeStyles={homeStyles}
          sending={sending}
          selectedFriend={selectedFriend}
          sendPicture={sendPicture}
          selectFriend={selectFriend}
          downloadPhoto={downloadPhoto}
          setUri={setUri}
        />
      ) : (
        permission?.granted && (
          <CameraViewComponent
            cameraRef={ref}
            mode={mode}
            facing={facing}
            flash={flash}
            challenge={challenge}
            loadingChallenge={loadingChallenge}
            homeStyles={homeStyles}
            takePicture={takePicture}
            toggleFacing={toggleFacing}
            toggleFlash={toggleFlash}
            showHistory={showHistory}
            showChallenge={showChallenge}
          />
        )
      )}
      
      {/* Feed Modal */}
      <FeedModal
        visible={feedModalVisible}
        setVisible={setFeedModalVisible}
        myPhotos={myPhotos}
        loadingPhotos={loadingPhotos}
        refreshing={refreshing}
        onRefreshPhotos={onRefreshPhotos}
        homeStyles={homeStyles}
        isIPFSImage={isIPFSImage}
        sendMessageAboutPhoto={sendMessageAboutPhoto}
      />
      
      {/* Challenge Modal */}
      <ChallengeModal
        visible={challengeModalVisible}
        setVisible={setChallengeModalVisible}
        challenge={challenge}
        loadingChallenge={loadingChallenge}
        submitChallenge={submitChallenge}
        isSubmittingChallenge={isSubmittingChallenge}
      />
    </View>
  );
}
