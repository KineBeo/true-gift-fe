import React from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
} from "react-native";
import {
  CameraView as ExpoCameraView,
  CameraType,
  CameraMode
} from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { TodayChallengeDto } from "@/lib/services/challenge";
import ChallengeCard from "@/components/ui/challenge/ChallengeCard";

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

export default CameraViewComponent; 