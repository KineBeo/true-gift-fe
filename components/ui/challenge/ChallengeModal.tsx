import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import {
  CameraType,
  CameraView,
} from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { homeStyles } from "../../../app/(app)/home/styles/homeStyles";
import { TodayChallengeDto } from "@/lib/services/challenge";

interface ChallengeModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  challenge: TodayChallengeDto | null;
  loadingChallenge: boolean;
  submitChallenge: (uri: string) => Promise<void>;
  isSubmittingChallenge: boolean;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({
  visible,
  setVisible,
  challenge,
  loadingChallenge,
  submitChallenge,
  isSubmittingChallenge,
}) => {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  
  // Camera states specific to the challenge modal
  const [challengeUri, setChallengeUri] = useState<string | null>(null);
  const [challengeFacing, setChallengeFacing] = useState<CameraType>("back");
  const [challengeFlash, setChallengeFlash] = useState(false);

  const takeChallengePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    setChallengeUri(photo?.uri ?? null);
  };

  const toggleChallengeFacing = () => {
    setChallengeFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const toggleChallengeFlash = () => {
    setChallengeFlash((prev) => !prev);
  };

  const handleSubmitChallenge = async () => {
    if (!challengeUri) {
      Alert.alert("Error", "Please take a photo first");
      return;
    }
    
    await submitChallenge(challengeUri);
    // Reset the challenge URI after submission
    setChallengeUri(null);
  };

  const closeModal = () => {
    setVisible(false);
    setChallengeUri(null);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={closeModal}
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
            {!challengeUri ? (
              <View className="flex-1 bg-black w-full items-center justify-center">
                {/* Challenge Info Banner */}
                <View className="absolute top-36 w-full px-4 m-4">
                  <View className="bg-zinc-800 p-4 rounded-[30px]">
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
                    ref={cameraRef}
                    facing={challengeFacing}
                    enableTorch={challengeFlash}
                  />
                </View>

                {/* Bottom controls */}
                <View className="flex-row w-full justify-between px-16 absolute bottom-36 items-center">
                  <Pressable
                    onPress={toggleChallengeFlash}
                    className="items-center justify-center w-12 h-12"
                  >
                    <Ionicons
                      name={challengeFlash ? "flash" : "flash-off"}
                      size={35}
                      color="#ffb800"
                    />
                  </Pressable>

                  {/* Capture button */}
                  <Pressable
                    onPress={takeChallengePhoto}
                    style={homeStyles.captureButton}
                  >
                    <View style={homeStyles.captureButtonInner} />
                  </Pressable>

                  <Pressable
                    onPress={toggleChallengeFacing}
                    className="items-center justify-center w-12 h-12"
                  >
                    <Ionicons name="sync" size={35} color="white" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="flex-1 bg-black w-full items-center justify-center">
                {/* Challenge Info Banner */}
                <View className="absolute top-36 w-full px-4 m-4">
                  <View className="bg-zinc-800 p-4 rounded-[30px]">
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

                {/* Image Preview */}
                <View style={homeStyles.challengeCameraContainer}>
                  <Image
                    source={{ uri: challengeUri }}
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
                    className="flex-row items-center bg-zinc-800/80 p-4 rounded-[40px] gap-1"
                    onPress={() => setChallengeUri(null)}
                  >
                    <Ionicons name="refresh" size={30} color="white" />
                    <Text className="text-white font-extrabold text-2xl">
                      Retake
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center bg-amber-400 p-4 rounded-[40px] gap-1"
                    onPress={handleSubmitChallenge}
                    disabled={isSubmittingChallenge}
                  >
                    {isSubmittingChallenge ? (
                      <ActivityIndicator size="small" color="black" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-sharp" size={30} color="black" />
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
            <View className="absolute top-16 left-0 p-4">
              <Pressable
                className="bg-zinc-800/80 p-4 rounded-full flex-row items-center"
                onPress={closeModal}
              >
                <Ionicons name="close" size={22} color="white" />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

export default ChallengeModal; 