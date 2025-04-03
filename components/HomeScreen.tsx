import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

interface HomeScreenProps {
  onLogout: () => void;
}

export const HomeScreen = ({ onLogout }: HomeScreenProps) => {
  const [friendCount, setFriendCount] = useState(1);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  
  // Demo images để mô phỏng
  const demoImages = [
    'https://images.unsplash.com/photo-1579033014049-f33886614b12',
    'https://images.unsplash.com/photo-1612464766154-2cd2e6e06273',
    'https://images.unsplash.com/photo-1674574124792-3be232f1869f'
  ];
  
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert('Permission required', 'Camera and media library permissions are needed to use this app');
      }
    })();
  }, []);

  const takePicture = async () => {
    try {
      // Thực tế sẽ mở camera, nhưng ở đây chỉ mô phỏng
      const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
      setCurrentImage(randomImage);
      console.log('Chụp ảnh thành công:', randomImage);
      
      // Trong thực tế sẽ lưu vào thư viện
      console.log('Đã lưu ảnh vào thư viện');

    } catch (error) {
      console.error('Lỗi khi chụp ảnh:', error);
    }
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
    console.log('Flash đã được ' + (!flashEnabled ? 'bật' : 'tắt'));
  };

  const toggleCameraType = () => {
    setIsFrontCamera(!isFrontCamera);
    console.log('Đã chuyển sang camera ' + (!isFrontCamera ? 'trước' : 'sau'));
  };

  if (hasPermission === null) {
    return <View className="flex-1 bg-black items-center justify-center"><Text className="text-white">Đang yêu cầu quyền truy cập...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View className="flex-1 bg-black items-center justify-center"><Text className="text-white">Không có quyền truy cập camera</Text></View>;
  }
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-2">
        <TouchableOpacity 
          className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center"
          onPress={onLogout}
        >
          <Ionicons name="person-outline" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-row items-center bg-zinc-800 rounded-full px-5 py-2">
          <Ionicons name="people" size={20} color="white" />
          <Text className="text-white ml-2 text-lg font-medium">
            {friendCount === 0 ? 'Add a Friend' : `${friendCount} Friend`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center">
          <Ionicons name="chatbubble-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Main Content / Camera View */}
      <View className="flex-1 justify-center items-center mt-4">
        <View className="w-[90%] aspect-square rounded-[40px] overflow-hidden">
          {currentImage ? (
            <TouchableOpacity onPress={() => setCurrentImage(null)}>
              <Image 
                source={{ uri: currentImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View className="w-full h-full bg-zinc-900 items-center justify-center">
              <Text className="text-white text-xl mb-2">Camera {isFrontCamera ? 'trước' : 'sau'}</Text>
              <Text className="text-white text-md">Flash {flashEnabled ? 'bật' : 'tắt'}</Text>
              <Text className="text-white text-md mt-4">Nhấn nút tròn để chụp ảnh</Text>
            </View>
          )}
          
          {/* Indicators */}
          <View className="absolute bottom-4 right-4 bg-zinc-800/50 rounded-md px-2 py-1">
            <Text className="text-white">1×</Text>
          </View>
        </View>
      </View>
      
      {/* Camera Controls */}
      <View className="pb-8 pt-4 px-10">
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity onPress={toggleFlash}>
            <FontAwesome 
              name="bolt" 
              size={28} 
              color={flashEnabled ? "yellow" : "white"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-white items-center justify-center"
            onPress={takePicture}
          >
            <View className="w-16 h-16 rounded-full bg-white" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleCameraType}>
            <Ionicons name="refresh" size={28} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* History Button */}
        <TouchableOpacity className="items-center">
          <View className="flex-row items-center bg-zinc-800 rounded-full px-5 py-2">
            <Ionicons name="images-outline" size={20} color="white" />
            <Text className="text-white ml-2 text-lg">History</Text>
          </View>
          <View className="mt-2">
            <Ionicons name="chevron-down" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}; 