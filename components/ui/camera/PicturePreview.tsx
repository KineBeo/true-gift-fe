import React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import IconOnlyButton from "../common/IconOnlyButton";
import IconButton from "../common/IconButton";

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
          <Ionicons name="images" size={22} color="white" />
          <Text className="text-white ml-2 font-bold text-2xl">
            {selectedFriend ? "Friend Selected" : "Select Friend"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default PicturePreview; 