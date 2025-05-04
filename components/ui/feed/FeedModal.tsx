import React, { useState, useEffect, useRef } from "react";
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
  const SCREEN_HEIGHT = Dimensions.get("window").height;

  // Get current item based on index
  const currentItem = myPhotos.length > 0 ? myPhotos[currentIndex] : null;

  // Reset messageText khi chuyển ảnh
  useEffect(() => {
    setMessageText("");
  }, [currentIndex]);

  const renderFeedItem = ({
    item,
    index,
  }: {
    item: ExtendedFileDto;
    index: number;
  }) => {
    const imageUrl = filesService.getFileUrl(item.path);
    const isIpfs = isIPFSImage(item.path);
    const isFriendPhoto = item.userId && item.userName;

    return (
      <View style={[homeStyles.feedItem, { height: SCREEN_HEIGHT }]}>
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
      </View>
    );
  };

  // Handle scroll end to update current index
  const handleViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  // Get current item properties for static UI elements
  const getCurrentItemDetails = () => {
    if (!currentItem)
      return { imageUrl: "", isIpfs: false, isFriendPhoto: false };

    const imageUrl = filesService.getFileUrl(currentItem.path);
    const isIpfs = isIPFSImage(currentItem.path);
    const isFriendPhoto = currentItem.userId && currentItem.userName;

    return { imageUrl, isIpfs, isFriendPhoto };
  };

  const { isFriendPhoto } = getCurrentItemDetails();

  // Cải thiện viewabilityConfig để có độ chính xác cao hơn
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

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
            {/* FlatList for scrollable content (only images and friend badge) */}
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
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
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
          {/* <Pressable
            className="bg-zinc-800/80 px-6 py-3 rounded-full flex-row items-center"
            onPress={() => setVisible(false)}
          >
            <Ionicons name="camera" size={22} color="white" />
            <Text className="text-white ml-2 font-extrabold text-xl">
              Camera
            </Text>
          </Pressable> */}

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
