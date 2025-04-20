import React, { useRef, useState } from "react";
import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { Pressable, StyleSheet, Text, View, Dimensions, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

export default function CameraTest() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);
  const [flash, setFlash] = useState(false);
  const router = useRouter();

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
    console.log({ video });
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
            // onPress={() => router.push("/(app)/profile/friends")}
          >
            <Ionicons name="person" size={22} color="white" />
          </Pressable>

          <Pressable className="bg-zinc-800/80 px-6 py-3 rounded-full flex-row items-center">
            <Ionicons name="people" size={22} color="white" />
            <Text className="text-white ml-2 font-extrabold text-xl">
              Send to ...
            </Text>
          </Pressable>

          <Pressable className="bg-zinc-800/80 p-4 rounded-full">
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
            // onPress={sendPicture}
            style={styles.sendButton}
          >
            <Ionicons name="paper-plane-outline" size={40} color="white" />
          </Pressable>

          <Pressable className="items-center justify-center w-12 h-12">
            <Ionicons name="sparkles-outline" size={32} color="white" />
          </Pressable>
        </View>

        {/* Send to friends */}
        <View className="absolute bottom-32 w-full items-center">
          <Pressable className="flex-row items-center bg-zinc-800/80 py-2 px-6 rounded-full">
            <Feather name="image" size={22} color="white" />
            <Text className="text-white ml-2 font-bold text-2xl">Friend</Text>
          </Pressable>
        </View>
      </View>
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

          <Pressable className="bg-zinc-800/80 p-4 rounded-full">
            <Ionicons name="chatbubble" size={22} color="white" />
          </Pressable>
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
          <Pressable className="flex-row items-center bg-zinc-800/80 py-2 px-6 rounded-full">
            <Feather name="image" size={22} color="white" />
            <Text className="text-white ml-2 font-bold text-2xl">History</Text>
          </Pressable>
        </View>
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
});
