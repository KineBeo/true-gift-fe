import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import IconOnlyButton from "../common/IconOnlyButton";
import IconButton from "../common/IconButton";
import { imageFilterService, FilterType } from "@/lib/services/image-filter";

interface PicturePreviewProps {
  uri: string | null;
  homeStyles: any;
  sending: boolean;
  selectedFriend: number | null;
  sendPicture: () => void;
  selectFriend: () => void;
  downloadPhoto: () => void;
  setUri: (uri: string | null) => void;
}

const PicturePreview: React.FC<PicturePreviewProps> = ({
  uri,
  homeStyles,
  sending,
  selectedFriend,
  sendPicture,
  selectFriend,
  downloadPhoto,
  setUri,
}) => {
  const router = useRouter();
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<Record<string, string>>({});
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);
  const [filterStrength, setFilterStrength] = useState(1.0);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [filteredUri, setFilteredUri] = useState<string | null>(null);

  // Load available filters when modal opens
  const loadFilters = useCallback(async () => {
    try {
      const filters = await imageFilterService.getAvailableFilters();
      setAvailableFilters(filters);
    } catch (error) {
      console.error('Error loading filters:', error);
      Alert.alert('Error', 'Failed to load filters');
    }
  }, []);

  // Apply selected filter to image
  const applyFilter = useCallback(async (filterName: FilterType) => {
    if (!uri) return;

    setIsApplyingFilter(true);
    try {
      const filteredImage = await imageFilterService.applyFilter(uri, filterName, filterStrength);

      // Convert blob to local URI
      const localUri = URL.createObjectURL(filteredImage);
      setFilteredUri(localUri);
      setUri(localUri); // Update the main image
      setIsFilterModalVisible(false);
    } catch (error) {
      console.error('Error applying filter:', error);
      Alert.alert('Error', 'Failed to apply filter');
    } finally {
      setIsApplyingFilter(false);
    }
  }, [uri, filterStrength, setUri]);

  return (
    <View className="flex-1 bg-black w-full items-center justify-center">
      {/* Take a picture */}
      <View style={homeStyles.cameraContainer}>
        <Image
          source={{ uri: filteredUri || uri || undefined }}
          contentFit="contain"
          style={{
            width: Dimensions.get("window").width * 0.975,
            aspectRatio: 1,
          }}
        />
      </View>

      {/* Friend count indicator */}
      <View className="absolute top-16 w-full flex-row justify-between px-4 m-4">
        <IconOnlyButton
          iconName="person"
          iconSize={25}
          iconColor="white"
          routePath="/profile"
        />

        <IconButton
          iconName="people"
          iconSize={25}
          iconColor="white"
          label="Send to..."
          routePath="/(app)/home/friends"
        />

        <IconOnlyButton
          iconName="download"
          iconSize={25}
          iconColor="white"
          onPress={downloadPhoto}
        />
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
            <Ionicons name="paper-plane-outline" size={35} color="white" />
          )}
        </Pressable>

        <Pressable
          className="items-center justify-center w-12 h-12"
          onPress={() => {
            loadFilters();
            setIsFilterModalVisible(true);
          }}
        >
          <Ionicons
            name="sparkles-outline"
            size={32}
            color={selectedFilter ? "#FFB800" : "white"}
          />
        </Pressable>
      </View>

      {/* Send to friends */}
      <View className="absolute bottom-32 w-full items-center">
        <Pressable
          className="flex-row items-center bg-zinc-800/80 py-2 px-6 rounded-full"
          onPress={selectFriend}
        >
          <Ionicons name="images" size={22} color="white" />
          <Text className="text-white ml-2 font-bold text-2xl">
            {selectedFriend ? "Friend Selected" : "Select Friend"}
          </Text>
        </Pressable>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View className="flex-1 bg-black/90">
          <View className="flex-1 mt-16">
            <View className="flex-row justify-between items-center px-4 py-2">
              <Text className="text-white text-xl font-bold">Select Filter</Text>
              <Pressable onPress={() => setIsFilterModalVisible(false)}>
                <Entypo name="cross" size={30} color="white" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-4">
              <View className="flex-row flex-wrap justify-between">
                {Object.entries(availableFilters).map(([filter, description]) => (
                  <TouchableOpacity
                    key={filter}
                    className={`w-[48%] bg-zinc-800/80 rounded-lg p-4 mb-4 ${selectedFilter === filter ? 'border-2 border-yellow-500' : ''
                      }`}
                    onPress={() => {
                      setSelectedFilter(filter as FilterType);
                      applyFilter(filter as FilterType);
                    }}
                  >
                    <Text className="text-white font-medium mb-2">{filter}</Text>
                    <Text className="text-gray-400 text-sm">{description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {isApplyingFilter && (
              <View className="absolute inset-0 bg-black/50 items-center justify-center">
                <ActivityIndicator size="large" color="white" />
                <Text className="text-white mt-4">Applying filter...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PicturePreview; 