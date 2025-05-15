import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
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
  const [availableFilters, setAvailableFilters] = useState<Record<string, string>>({});
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);
  const [filterStrength, setFilterStrength] = useState(1.0);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [filteredUri, setFilteredUri] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Cache for original image blob
  const originalImageRef = useRef<{ uri: string; blob: Blob | null }>({
    uri: '',
    blob: null
  });

  // Load available filters when component mounts
  useEffect(() => {
    loadFilters();
  }, []);

  // Cache original image when uri changes
  useEffect(() => {
    if (uri && uri !== originalImageRef.current.uri) {
      cacheOriginalImage(uri);
    }
  }, [uri]);

  // Cache original image
  const cacheOriginalImage = async (imageUri: string) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      originalImageRef.current = {
        uri: imageUri,
        blob: blob
      };
    } catch (error) {
      console.error('Error caching original image:', error);
    }
  };

  // Load available filters
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
    if (!uri || !originalImageRef.current.blob) return;

    setIsApplyingFilter(true);
    try {
      // Use cached original image
      const filteredImage = await imageFilterService.applyFilter(
        originalImageRef.current.blob,
        filterName,
        filterStrength
      );

      if (Platform.OS === 'web') {
        // For web platform
        const localUri = URL.createObjectURL(filteredImage);
        setFilteredUri(localUri);
        setUri(localUri);
      } else {
        // For native platforms (iOS, Android)
        const fr = new FileReader();
        fr.onload = async () => {
          const base64 = fr.result as string;
          setFilteredUri(base64);
          setUri(base64);
        };
        fr.readAsDataURL(filteredImage);
      }
    } catch (error) {
      console.error('Error applying filter:', error);
      Alert.alert('Error', 'Failed to apply filter');
    } finally {
      setIsApplyingFilter(false);
    }
  }, [uri, filterStrength, setUri]);

  // Reset to original image
  const resetToOriginal = useCallback(() => {
    setSelectedFilter(null);
    setFilteredUri(null);
    setUri(originalImageRef.current.uri);
  }, [setUri]);

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
          onPress={() => setShowFilters(!showFilters)}
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

      {/* Filter Bottom Bar */}
      {showFilters && (
        <View className="absolute bottom-0 w-full bg-black/90 pb-8">
          <View className="flex-row justify-between items-center px-4 py-2">
            <Text className="text-white text-xl font-bold">Filters</Text>
            {isApplyingFilter && (
              <ActivityIndicator size="small" color="white" />
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-2"
          >
            <TouchableOpacity
              className={`mr-3 items-center justify-center w-16 h-16 rounded-lg ${selectedFilter === null ? 'bg-yellow-500' : 'bg-zinc-800'
                }`}
              onPress={resetToOriginal}
            >
              <Ionicons name="close-circle-outline" size={24} color="white" />
              <Text className="text-white text-xs mt-1">Original</Text>
            </TouchableOpacity>

            {Object.entries(availableFilters).map(([filter, description]) => (
              <TouchableOpacity
                key={filter}
                className={`mr-3 items-center justify-center w-16 h-16 rounded-lg ${selectedFilter === filter ? 'bg-yellow-500' : 'bg-zinc-800'
                  }`}
                onPress={() => {
                  setSelectedFilter(filter as FilterType);
                  applyFilter(filter as FilterType);
                }}
              >
                <Ionicons name="sparkles-outline" size={24} color="white" />
                <Text className="text-white text-xs mt-1" numberOfLines={1}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default PicturePreview; 