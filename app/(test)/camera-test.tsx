import {
    CameraMode,
    CameraType,
    CameraView,
    useCameraPermissions,
  } from "expo-camera";
  import { useRef, useState } from "react";
  import { Pressable, StyleSheet, Text, View, StatusBar } from "react-native";
  import { Image } from "expo-image";
  import { Feather, Ionicons, FontAwesome } from "@expo/vector-icons";
  import { SafeAreaView } from "react-native-safe-area-context";
  
  export default function CameraTest() {
    const [permission, requestPermission] = useCameraPermissions();
    const ref = useRef<CameraView>(null);
    const [uri, setUri] = useState<string | null>(null);
    const [mode, setMode] = useState<CameraMode>("picture");
    const [facing, setFacing] = useState<CameraType>("back");
    const [recording, setRecording] = useState(false);
    const [zoom, setZoom] = useState(1);
  
    if (!permission) {
      return null;
    }
  
    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={{ textAlign: "center", color: "white" }}>
            We need your permission to use the camera
          </Text>
          <Pressable 
            onPress={requestPermission} 
            style={styles.permissionButton}
          >
            <Text style={styles.permissionButtonText}>Grant permission</Text>
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
  
    const renderPhotoPreview = () => {
      return (
        <View style={styles.fullScreenContainer}>
          <StatusBar barStyle="light-content" />
          <Image
            source={{ uri }}
            contentFit="cover"
            style={styles.fullScreenImage}
          />
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{zoom}×</Text>
          </View>
          <View style={styles.header}>
            <Pressable style={styles.profileButton}>
              <Ionicons name="person" size={24} color="white" />
            </Pressable>
            
            <View style={styles.friendCountContainer}>
              <Ionicons name="people" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.friendCountText}>  Friend</Text>
            </View>
            
            <Pressable style={styles.messageButton}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
            </Pressable>
          </View>
          
          <View style={styles.bottomControls}>
            <Pressable style={styles.controlButton} onPress={toggleMode}>
              <FontAwesome name="bolt" size={28} color="white" />
            </Pressable>
            
            <Pressable style={styles.captureButton} onPress={() => setUri(null)}>
              <View style={styles.captureButtonInner} />
            </Pressable>
            
            <Pressable style={styles.controlButton} onPress={toggleFacing}>
              <Ionicons name="refresh" size={28} color="white" />
            </Pressable>
          </View>
          
          <Pressable style={styles.historyButton}>
            <Ionicons name="images-outline" size={22} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.historyButtonText}>History</Text>
          </Pressable>
        </View>
      );
    };
  
    const renderCamera = () => {
      return (
        <View style={styles.fullScreenContainer}>
          <StatusBar barStyle="light-content" />
          <CameraView
            style={styles.camera}
            ref={ref}
            mode={mode}
            facing={facing}
            zoom={zoom}
          >
            <View style={styles.header}>
              <Pressable style={styles.profileButton}>
                <Ionicons name="person" size={24} color="white" />
              </Pressable>
              
              <View style={styles.friendCountContainer}>
                <Ionicons name="people" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.friendCountText}>1 Friend</Text>
              </View>
              
              <Pressable style={styles.messageButton}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
              </Pressable>
            </View>
            
            <View style={styles.zoomIndicator}>
              <Text style={styles.zoomText}>{zoom}×</Text>
            </View>
            
            <View style={styles.bottomControls}>
              <Pressable style={styles.controlButton} onPress={toggleMode}>
                <FontAwesome name="bolt" size={28} color="white" />
              </Pressable>
              
              <Pressable 
                style={styles.captureButton} 
                onPress={mode === "picture" ? takePicture : recordVideo}
              >
                <View style={[
                  styles.captureButtonInner,
                  recording && { backgroundColor: "red" }
                ]} />
              </Pressable>
              
              <Pressable style={styles.controlButton} onPress={toggleFacing}>
                <Ionicons name="refresh" size={28} color="white" />
              </Pressable>
            </View>
            
            <Pressable style={styles.historyButton}>
              <Ionicons name="images-outline" size={22} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.historyButtonText}>History</Text>
            </Pressable>
          </CameraView>
        </View>
      );
    };
  
    return uri ? renderPhotoPreview() : renderCamera();
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    fullScreenContainer: {
      flex: 1,
      backgroundColor: "#000",
      position: "relative",
    },
    fullScreenImage: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    camera: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    header: {
      position: "absolute",
      top: 50,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      zIndex: 10,
    },
    profileButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(60, 60, 60, 0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    friendCountContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(60, 60, 60, 0.8)",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 30,
    },
    friendCountText: {
      color: "white",
      fontSize: 18,
      fontWeight: "600",
    },
    messageButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(60, 60, 60, 0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    bottomControls: {
      position: "absolute",
      bottom: 120,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingHorizontal: 30,
    },
    captureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 5,
      borderColor: "#FFBF00",
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    captureButtonInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "white",
    },
    controlButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
    },
    zoomIndicator: {
      position: "absolute",
      bottom: 60,
      alignSelf: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 15,
    },
    zoomText: {
      color: "white",
      fontSize: 14,
    },
    historyButton: {
      position: "absolute",
      bottom: 40,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(60, 60, 60, 0.8)",
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 20,
    },
    historyButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "500",
    },
    permissionButton: {
      backgroundColor: "#FFBF00",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 20,
    },
    permissionButtonText: {
      color: "black",
      fontSize: 16,
      fontWeight: "bold",
    },
  });