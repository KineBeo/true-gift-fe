import React from "react";
import { View, Text, Pressable, TouchableOpacity } from "react-native";
import {
  CameraView as ExpoCameraView,
  CameraType,
  CameraMode,
} from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { TodayChallengeDto } from "@/lib/services/challenge";
import ChallengeCard from "@/components/ui/challenge/ChallengeCard";
import IconButton from "../common/IconButton";
import IconOnlyButton from "../common/IconOnlyButton";

interface CameraViewProps {
  cameraRef: React.RefObject<ExpoCameraView | null>;
  mode: CameraMode;
  facing: CameraType;
  flash: boolean;
  challenge: TodayChallengeDto | null;
  loadingChallenge: boolean;
  homeStyles: any; // The styles from home component
  takePicture: () => void;
  toggleFacing: () => void;
  toggleFlash: () => void;
  showHistory: () => void;
  showChallenge: () => void;
}

const CameraViewComponent: React.FC<CameraViewProps> = ({
  cameraRef,
  mode,
  facing,
  flash,
  challenge,
  loadingChallenge,
  homeStyles,
  takePicture,
  toggleFacing,
  toggleFlash,
  showHistory,
  showChallenge,
}) => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black w-full items-center justify-center">
      <ChallengeCard challenge={challenge} loading={loadingChallenge} />
      <View style={homeStyles.cameraContainer}>
        <ExpoCameraView
          style={homeStyles.camera}
          ref={cameraRef}
          mode={mode}
          facing={facing}
          enableTorch={flash}
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
          label="1 Friends"
          routePath="/(app)/home/friends"
        />
        <IconOnlyButton
          iconName="chatbubble"
          iconSize={25}
          iconColor="white"
          routePath="/message"
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
        <Pressable onPress={takePicture} style={homeStyles.captureButton}>
          <View style={[homeStyles.captureButtonInner]} />
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
        <IconButton
          iconName="image"
          label="History"
          labelStyles="text-white font-bold text-[18px]"
          className="flex-1 justify-center gap-1 mx-4 py-4"
          onPress={showHistory}
        />
        <IconButton
          iconName="trophy-sharp"
          label="Challenge"
          labelStyles="text-white font-bold text-[18px]"
          className="flex-1 justify-center gap-1 mx-4 py-4"
          onPress={showChallenge}
        />
      </View>
    </View>
  );
};

export default CameraViewComponent;
