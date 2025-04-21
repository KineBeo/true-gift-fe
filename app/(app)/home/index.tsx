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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as FileSystem from "expo-file-system";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 4;
const NUM_COLUMNS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - (GRID_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

// Function to group photos by date (month and year)
const groupPhotosByDate = (photos: FileDto[]) => {
  const groups: { [key: string]: FileDto[] } = {};
  
  photos.forEach(photo => {
    if (!photo.createdAt) return;
    
    const date = new Date(photo.createdAt);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(photo);
  });
  
  // Convert to array format for section list
  return Object.keys(groups).map(date => ({
    title: date,
    data: groups[date]
  }));
};

// Helper function to detect IPFS-stored images
const isIPFSImage = (path: string): boolean => {
  if (!path) return false;
  
  // Check for direct IPFS CID format (no slashes and starts with typical IPFS prefixes)
  if (!path.includes('/') && (
    path.startsWith('Qm') || 
    path.startsWith('bafy') || 
    path.startsWith('bafk') ||
    !!path.match(/^[a-zA-Z0-9]{46,59}$/)
  )) {
    return true;
  }
  
  // Check for URLs containing IPFS gateways
  if (path.includes('/ipfs/') || 
      path.includes('gateway.pinata.cloud') ||
      path.includes('mypinata.cloud')) {
    return true;
  }
  
  return false;
};

export default function Home() {
  const { user, logout, isAuthenticated } = useAuthStore();
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
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [myPhotos, setMyPhotos] = useState<FileDto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [groupedPhotos, setGroupedPhotos] = useState<{ title: string, data: FileDto[] }[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<FileDto | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const router = useRouter();
  
  // Animation values
  const modalTranslateY = useSharedValue(500);
  const modalOpacity = useSharedValue(0);
  const photoPreviewScale = useSharedValue(1);
  
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
  
  // Animation styles
  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: modalTranslateY.value }],
      opacity: modalOpacity.value,
    };
  });
  
  const photoPreviewAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: photoPreviewScale.value }],
    };
  });

  const openHistoryModal = () => {
    setHistoryModalVisible(true);
    modalTranslateY.value = withSpring(0, { damping: 15 });
    modalOpacity.value = withTiming(1, { duration: 300 });
  };

  const closeHistoryModal = () => {
    modalTranslateY.value = withSpring(500, { damping: 15 }, () => {
      runOnJS(setHistoryModalVisible)(false);
    });
    modalOpacity.value = withTiming(0, { duration: 300 });
  };
  
  const viewPhotoDetail = (photo: FileDto) => {
    setSelectedPhoto(photo);
    photoPreviewScale.value = withSpring(1.05);
    setTimeout(() => {
      photoPreviewScale.value = withSpring(1);
    }, 200);
  };

  const fetchMyPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const response = await filesService.getMyPhotos();
      if (response && response.data) {
        setMyPhotos(response.data);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
      Alert.alert("Error", "Failed to load your photos");
    } finally {
      setLoadingPhotos(false);
    }
  };
  
  const onRefreshPhotos = useCallback(async () => {
    setRefreshing(true);
    await fetchMyPhotos();
    setRefreshing(false);
  }, []);

  const showHistory = () => {
    fetchMyPhotos();
    openHistoryModal();
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/welcome");
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
      // console.log(`Attempting to upload photo: ${uri}`);
      
      // Check if the URI is valid for upload - must be a local file:// or content:// URI
      if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
        console.warn(`URI format might not be compatible: ${uri.substring(0, 20)}...`);
      }
      
      // Try getting file info if possible
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        // console.log('File info before upload:', {
        //   exists: fileInfo.exists,
        //   size: fileInfo.exists ? (fileInfo as any).size : 'N/A',
        //   uri: fileInfo.uri.substring(0, 30) + '...' // Truncate for logging
        // });
        
        if (!fileInfo.exists) {
          throw new Error('File does not exist at the specified URI');
        }
      } catch (fileInfoError) {
        console.warn('Unable to verify file info:', fileInfoError);
      }
      
      // Upload the photo - always use the default 'message' type
      // If no friend is selected, we'll just upload without specifying a recipient
      const response = await filesService.uploadPhoto(uri, {
        type: 'message',
        toUserId: selectedFriend || undefined
      });

      console.log('Upload response:', JSON.stringify(response));

      if (response.success) {
        // console.log('Upload successful:', response.file);
        // Show success message
        Alert.alert(
          "Success",
          "Photo uploaded successfully!",
          [
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
          ]
        );
      } else {
        console.error('Upload failed with response:', JSON.stringify(response));
        throw new Error(response.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error sending photo:", error);
      console.error("Error details:", error instanceof Error ? error.message : 'Unknown error');
      
      // More user-friendly error message
      Alert.alert(
        "Upload Failed",
        `Unable to upload your photo. ${error instanceof Error ? error.message : 'Please try again later.'}`,
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
            onPress={() => router.push("/(app)/profile/friends")}
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

  // Photo History Modal Component
  const renderPhotoHistory = () => {
    const renderPhotoItem = ({ item }: { item: FileDto }) => {
      // Get the image URL, handling both IPFS and local files
      const imageUrl = filesService.getFileUrl(item.path);
      const isIpfs = isIPFSImage(item.path);
      
      // Use for debugging
      // console.log(`Rendering photo ${item.id} with URL: ${imageUrl}`);
      // console.log(`Is IPFS: ${isIpfs}, Path: ${item.path}`);
      
      return (
        <TouchableOpacity 
          style={styles.photoItem} 
          onPress={() => viewPhotoDetail(item)}
          activeOpacity={0.8}
        >
          {failedImages[item.id] ? (
            <View style={[styles.thumbnail, styles.fallbackContainer]}>
              <Feather name="image" size={24} color="#999" />
              <Text style={styles.fallbackText}>Image</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              // Use different cache policy for IPFS images
              cachePolicy={isIpfs ? "memory-disk" : "memory"}
              onError={(error) => {
                console.log(`Failed to load image: ${item.id}, URL: ${imageUrl}`);
                console.log('Error details:', error);
                setFailedImages(prev => ({ ...prev, [item.id]: true }));
              }}
            />
          )}
          {isIpfs && (
            <View style={styles.ipfsBadge}>
              <Text style={styles.ipfsBadgeText}>IPFS</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    };
    
    const renderPhotoGrid = () => (
      <FlatList
        data={myPhotos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPhotoItem}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.photoGrid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshPhotos}
            tintColor="#FFB800"
            colors={["#FFB800"]}
          />
        }
        ListEmptyComponent={
          loadingPhotos ? null : (
            <View style={styles.emptyContainer}>
              <Feather name="camera-off" size={48} color="#999" />
              <Text style={styles.emptyText}>No photos found</Text>
              <Text style={styles.emptySubtext}>Photos you take will appear here</Text>
            </View>
          )
        }
      />
    );
    
    // Photo detail view - shown when a photo is selected
    const renderPhotoDetail = () => {
      // Skip if no photo is selected
      if (!selectedPhoto) return null;
      
      const imageUrl = filesService.getFileUrl(selectedPhoto.path);
      const isIpfs = isIPFSImage(selectedPhoto.path);
      
      // console.log('Rendering detail view for photo:', {
      //   id: selectedPhoto.id,
      //   path: selectedPhoto.path,
      //   url: imageUrl,
      //   isIpfs
      // });
      
      // Format date nicely
      const formattedDate = selectedPhoto.createdAt 
        ? new Date(selectedPhoto.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Recent photo';
        
      // Helper to open IPFS gateway in browser
      const openIpfsGateway = () => {
        if (isIpfs) {
          // Extract just the CID if it's a full URL
          let cid = selectedPhoto.path;
          if (cid.includes('/ipfs/')) {
            cid = cid.split('/ipfs/')[1];
          }
          
          // Create a shareable link to the Pinata gateway
          const shareUrl = `https://lavender-useful-yak-720.mypinata.cloud/ipfs/${cid}`;
          
          // Share the URL
          Linking.openURL(shareUrl);
        }
      };
      
      return (
        <View style={styles.photoDetailContainer}>
          <Animated.View style={[styles.photoDetailContent, photoPreviewAnimatedStyle]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.photoDetailImage}
              contentFit="contain"
              cachePolicy={isIpfs ? "memory-disk" : "memory"}
              onError={(error) => {
                console.error('Error loading detail image:', error);
                // console.log('Detail image path:', selectedPhoto.path);
                // console.log('Image URL:', imageUrl);
              }}
            />
            <View style={styles.photoDetailInfo}>
              <Text style={styles.photoDetailDate}>{formattedDate}</Text>
              
              {selectedPhoto.filename && (
                <Text style={styles.photoDetailFileName}>{selectedPhoto.filename}</Text>
              )}
              
              {isIpfs ? (
                <TouchableOpacity 
                  style={styles.ipfsInfoBadge}
                  onPress={openIpfsGateway}
                >
                  <View style={styles.ipfsHeaderRow}>
                    <MaterialIcons name="cloud-done" size={16} color="#fff" />
                    <Text style={styles.ipfsInfoText}>Stored on IPFS</Text>
                  </View>
                  <Text style={styles.ipfsCidText}>
                    {selectedPhoto.path.length > 30 
                      ? `${selectedPhoto.path.substring(0, 12)}...${selectedPhoto.path.substring(selectedPhoto.path.length - 8)}`
                      : selectedPhoto.path
                    }
                  </Text>
                  <Text style={styles.ipfsLinkText}>Tap to view in browser</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.localStorageBadge}>
                  <View style={styles.storageHeaderRow}>
                    <Feather name="hard-drive" size={16} color="#fff" />
                    <Text style={styles.storageInfoText}>Stored locally</Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
          <TouchableOpacity 
            style={styles.photoDetailClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close-circle" size={32} color="white" />
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <Modal
        transparent={true}
        visible={historyModalVisible}
        onRequestClose={closeHistoryModal}
        animationType="none"
      >
        <StatusBar style="light" />
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={closeHistoryModal}
              >
                <Ionicons name="chevron-down" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Your Photos</Text>
              <View style={styles.modalHeaderRight}>
                {/* Right side placeholder for symmetry */}
                <View style={{ width: 28 }} />
              </View>
            </View>
            
            {/* Loading indicator */}
            {loadingPhotos && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFB800" />
              </View>
            )}
            
            {/* Content */}
            {!selectedPhoto ? renderPhotoGrid() : renderPhotoDetail()}
          </Animated.View>
        </View>
      </Modal>
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
            onPress={() => router.push("/(app)/profile")}
          >
            <Ionicons name="person" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-zinc-800/80 px-6 py-3 rounded-full flex-row items-center">
            <Ionicons name="people" size={22} color="white" />
            <Text className="text-white ml-2 font-extrabold text-xl">
              1 Friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(app)/message")} className="bg-zinc-800/80 p-4 rounded-full">
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

        {/* History */}
        <View className="absolute bottom-32 w-full items-center">
          <Pressable 
            className="flex-row items-center bg-zinc-800/80 py-2 px-6 rounded-full"
            onPress={showHistory}
          >
            <Feather name="image" size={22} color="white" />
            <Text className="text-white ml-2 font-bold text-2xl">History</Text>
          </Pressable>
        </View>

        {/* Render the enhanced photo history modal */}
        {renderPhotoHistory()}
      </View>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      {uri ? renderPicture() : renderCamera()}
    </>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    width: Dimensions.get("window").width * 0.975,
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 50,
    marginBottom: 150,
  },
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  captureButton: {
    width: 95,
    height: 95,
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
    width: 75,
    height: 75,
    borderRadius: 50,
    backgroundColor: "white",
  },
  // Enhanced modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? RNStatusBar.currentHeight : 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalHeaderRight: {
    width: 28,
  },
  photoGrid: {
    padding: GRID_SPACING,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: GRID_SPACING,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  photoDetailContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetailContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetailImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
  },
  photoDetailInfo: {
    padding: 16,
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    marginTop: 16,
  },
  photoDetailDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  photoDetailFileName: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  photoDetailClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  ipfsBadge: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ipfsBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  ipfsInfoBadge: {
    backgroundColor: 'rgba(0, 102, 204, 0.7)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  ipfsInfoText: {
    color: 'white',
    fontWeight: 'bold',
  },
  ipfsCidText: {
    color: '#eee',
    fontSize: 12,
    marginTop: 4,
  },
  fallbackContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
  },
  ipfsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipfsLinkText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  localStorageBadge: {
    backgroundColor: 'rgba(0, 102, 204, 0.7)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  storageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storageInfoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
