import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import filesService, { FileDto } from "@/lib/services/files";
import { LinearGradient } from "expo-linear-gradient";

interface ExtendedFileDto extends FileDto {
  userId?: number | null;
  userName?: string | null;
}

interface FeedModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  myPhotos: ExtendedFileDto[];
  loadingPhotos: boolean;
  refreshing: boolean;
  onRefreshPhotos: () => void;
  homeStyles: any;
  isIPFSImage: (path: string) => boolean;
  sendMessageAboutPhoto: (
    userId: number | null | undefined,
    photoURL: string,
    message: string
  ) => Promise<void>;
}

const FeedModal: React.FC<FeedModalProps> = ({
  visible,
  setVisible,
  myPhotos,
  loadingPhotos,
  refreshing,
  onRefreshPhotos,
  homeStyles,
  isIPFSImage,
  sendMessageAboutPhoto,
}) => {
  const router = useRouter();
  const [messageText, setMessageText] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeMessageItem, setActiveMessageItem] = useState<string | null>(
    null
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const flatListRef = useRef<FlatList>(null);

  // Get current item based on index
  const currentItem = myPhotos.length > 0 ? myPhotos[currentIndex] : null;

  // Preload first image as soon as modal is visible
  useEffect(() => {
    if (visible && myPhotos.length > 0 && !firstImageLoaded) {
      const firstImage = myPhotos[0];
      const imageUrl = filesService.getFileUrl(firstImage.path);
      
      // Preload first image with high priority
      Image.prefetch(imageUrl).then(() => {
        // Mark first image as loaded in state
        setImageLoading(prev => ({
          ...prev,
          [firstImage.id]: false
        }));
        setFirstImageLoaded(true);
      }).catch(() => {
        setImageErrors(prev => ({
          ...prev,
          [firstImage.id]: true
        }));
      });
      
      // Preload second image if available with normal priority
      if (myPhotos.length > 1) {
        const secondImage = myPhotos[1];
        const secondImageUrl = filesService.getFileUrl(secondImage.path);
        Image.prefetch(secondImageUrl);
      }
    }
  }, [visible, myPhotos, firstImageLoaded]);

  // Initialize loading states for all photos
  useEffect(() => {
    if (myPhotos.length > 0) {
      const newLoadingState: Record<string, boolean> = {};
      
      myPhotos.forEach((photo, index) => {
        // Only set if not already set
        if (imageLoading[photo.id] === undefined) {
          // First image gets special treatment
          if (index === 0 && visible) {
            // We'll handle the first image in the preload effect
            newLoadingState[photo.id] = true;
          } else {
            newLoadingState[photo.id] = true;
          }
        }
      });
      
      // Only update state if we have new items to add
      if (Object.keys(newLoadingState).length > 0) {
        setImageLoading(prev => ({
          ...prev,
          ...newLoadingState
        }));
      }
    }
  }, [myPhotos]);

  // Precache next images
  useEffect(() => {
    if (myPhotos.length > currentIndex + 1) {
      // Preload next image
      const nextImage = myPhotos[currentIndex + 1];
      const nextImageUrl = filesService.getFileUrl(nextImage.path);
      
      // Create a new Image to preload
      if (Platform.OS !== 'web') {
        Image.prefetch(nextImageUrl);
      }
    }
  }, [currentIndex, myPhotos]);

  // Reset messageText khi chuyển ảnh
  useEffect(() => {
    setMessageText("");
  }, [currentIndex]);

  const handleImageLoad = useCallback((id: string) => {
    setImageLoading(prev => ({
      ...prev,
      [id]: false
    }));
  }, []);

  const handleImageError = useCallback((id: string) => {
    setImageErrors(prev => ({
      ...prev,
      [id]: true
    }));
    setImageLoading(prev => ({
      ...prev,
      [id]: false
    }));
  }, []);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const renderFeedItem = useCallback(({
    item,
    index,
  }: {
    item: ExtendedFileDto;
    index: number;
  }) => {
    const imageUrl = filesService.getFileUrl(item.path);
    const isIpfs = isIPFSImage(item.path);
    const isFriendPhoto = item.userId && item.userName;
    const isUserPhoto = !item.userId; // Ảnh không có userId được coi là ảnh của người dùng hiện tại
    const isFirstItem = index === 0;
    
    // Transition time is faster for first image for perceived speed
    const transitionTime = isFirstItem ? 100 : 200;
    
    return (
      <View style={[homeStyles.feedItem, { height: SCREEN_HEIGHT }]}>
        <View className="flex-1 bg-black w-full items-center justify-center">
          <View style={homeStyles.feedCameraContainer}>
            {/* Skeleton loader shown while image is loading */}
            {imageLoading[item.id] && (
              <LinearGradient
                colors={['#262626', '#393939', '#262626']}
                style={[homeStyles.feedImage, { position: 'absolute', zIndex: 1 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            
            {/* Error state */}
            {imageErrors[item.id] ? (
              <View style={[homeStyles.feedImage, {alignItems: 'center', justifyContent: 'center', backgroundColor: '#262626'}]}>
                <Ionicons name="image-outline" size={60} color="#666" />
                <Text className="text-gray-400 mt-2">Failed to load image</Text>
                <TouchableOpacity 
                  className="bg-yellow-600 px-4 py-2 rounded-full mt-4"
                  onPress={() => {
                    setImageErrors(prev => ({...prev, [item.id]: false}));
                    setImageLoading(prev => ({...prev, [item.id]: true}));
                  }}
                >
                  <Text className="text-white font-bold">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                contentFit="cover"
                transition={transitionTime}
                style={homeStyles.feedImage}
                cachePolicy={isIpfs ? "memory-disk" : "disk"}
                recyclingKey={item.id}
                onLoad={() => handleImageLoad(item.id)}
                onError={() => handleImageError(item.id)}
                priority={isFirstItem || index === currentIndex ? "high" : "normal"}
                placeholder={isFirstItem ? undefined : null}
              />
            )}
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
          
          {/* User name badge if it's the user's own photo */}
          {isUserPhoto && (
            <View className="flex-row items-center py-2 px-3 rounded-3xl bg-yellow-600 mt-4">
              <Ionicons name="person-circle" size={20} color="white" />
              <Text className="font-bold text-lg ml-2 text-white">
                You
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [homeStyles, imageLoading, imageErrors, currentIndex, handleImageLoad, handleImageError, isIPFSImage]);

  // Get current item properties for static UI elements
  const getCurrentItemDetails = () => {
    if (!currentItem)
      return { imageUrl: "", isIpfs: false, isFriendPhoto: false, isUserPhoto: false };

    const imageUrl = filesService.getFileUrl(currentItem.path);
    const isIpfs = isIPFSImage(currentItem.path);
    const isFriendPhoto = currentItem.userId && currentItem.userName;
    const isUserPhoto = !currentItem.userId; // Ảnh không có userId được coi là ảnh của người dùng hiện tại

    return { imageUrl, isIpfs, isFriendPhoto, isUserPhoto };
  };

  const { isFriendPhoto, isUserPhoto } = getCurrentItemDetails();

  // Tạo viewabilityConfig để theo dõi item hiển thị
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 100,
  }), []);
  
  // Lấy item layout trước để scroll mượt hơn
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  }), [SCREEN_HEIGHT]);

  // Xử lý khi người dùng vuốt đến cuối item
  const handleMomentumScrollEnd = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(contentOffset / SCREEN_HEIGHT);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
        });
      }
    }
  }, [currentIndex, SCREEN_HEIGHT]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
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
          <>
            {/* FlatList for scrollable content (optimized) */}
            <FlatList
              ref={flatListRef}
              data={myPhotos}
              keyExtractor={(item) => item.id}
              renderItem={renderFeedItem}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              snapToInterval={SCREEN_HEIGHT}
              snapToAlignment="start"
              decelerationRate="fast"
              initialNumToRender={2}
              maxToRenderPerBatch={2}
              windowSize={3}
              getItemLayout={getItemLayout}
              removeClippedSubviews={true}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefreshPhotos}
                  tintColor="#FFB800"
                  colors={["#FFB800"]}
                />
              }
            />

            {/* Static UI elements */}
            {myPhotos.length > 0 && (
              <>
                {/* Message box - cập nhật placeholder */}
                {isFriendPhoto && currentItem && (
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[
                      homeStyles.messageBoxContainer,
                      { position: "absolute", bottom: 160, left: 0, right: 0 },
                    ]}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}
                  >
                    <View className="flex-row items-center bg-zinc-800 rounded-full px-4 py-2 mx-4">
                      <TextInput
                        className="flex-1 text-gray-300 text-xl mr-2 font-bold p-2"
                        placeholder={`Message to ${currentItem.userName}...`}
                        placeholderTextColor="white"
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxLength={200}
                      />
                      <TouchableOpacity
                        style={homeStyles.messageSendButton}
                        onPress={() =>
                          currentItem &&
                          sendMessageAboutPhoto(
                            currentItem.userId,
                            currentItem.path,
                            messageText
                          )
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
                  </KeyboardAvoidingView>
                )}

                {/* Bottom controls - Static */}
                <View className="flex-row w-full justify-between px-16 absolute bottom-16 items-center">
                  <TouchableOpacity className="items-center justify-center w-12 h-12"
                  onPress={() => {
                    setVisible(false);
                    router.push("/home/image-history");
                  }}>
                    <Ionicons name="grid" size={35} color="white" />
                  </TouchableOpacity>

                  {/* Like button placeholder */}
                  <Pressable
                    style={homeStyles.captureButton}
                    onPress={() => {
                     setVisible(false);
                    }}
                  >
                    <View style={[homeStyles.captureButtonInner]} />
                  </Pressable>

                  {/* Share Button */}
                  <TouchableOpacity className="items-center justify-center w-12 h-12">
                    <Ionicons name="share-social" size={35} color="white" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}

        {/* Feed control buttons - Static */}
        <View className="absolute top-16 w-full flex-row justify-between px-8 mt-4">
          <TouchableOpacity 
            className="bg-zinc-800/80 px-3 py-3 rounded-full"
            onPress={() => setVisible(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {/* Thêm số thứ tự ảnh */}
          {myPhotos.length > 0 && (
            <View className="bg-zinc-800/80 p-4 rounded-full">
              <Text className="text-white font-bold">
                {currentIndex + 1} / {myPhotos.length}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default FeedModal;
