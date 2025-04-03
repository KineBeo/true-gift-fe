import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

interface SignupScreenProps {
  onLogin: () => void;
}

export const SignupScreen = ({ onLogin }: SignupScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState('+1 201-555-0123');
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome' hoặc 'phone'

  const renderWelcomeScreen = () => {
    return (
      <View className="flex-1 items-center justify-center px-4">
        {/* Logo và giới thiệu */}
        <View className="items-center flex-1 justify-center">
          <View className="w-64 h-64 mb-8">
            <View className="bg-zinc-800 border-2 border-zinc-700 rounded-[40px] w-full h-full items-center justify-center">
              <View className="grid-cols-4 grid-rows-4 h-full w-full relative">
                {/* Hiển thị các nút giả */}
                <View className="absolute left-8 top-20 bg-zinc-700 rounded-lg w-14 h-14" />
                <View className="absolute left-8 top-36 bg-zinc-700 rounded-lg w-14 h-14" />
                <View className="absolute left-24 top-20 bg-zinc-700 rounded-lg w-14 h-14" />
                <View className="absolute left-24 top-36 bg-zinc-700 rounded-lg w-14 h-14" />
                <View className="absolute left-40 top-20 bg-zinc-700 rounded-lg w-14 h-14" />
                <View className="absolute left-40 top-36 bg-zinc-700 rounded-lg w-14 h-14" />
                <View className="absolute left-24 top-52 bg-zinc-700 rounded-lg w-14 h-14" />
                
                {/* Ảnh người dùng nổi bật */}
                <View className="absolute left-40 top-36 bg-yellow-500 rounded-lg w-14 h-14 border-2 border-yellow-500 items-center justify-center overflow-hidden">
                  <Text className="text-black text-[8px]">Ảnh</Text>
                </View>
              </View>
            </View>
          </View>
          <Text className="text-white text-4xl font-bold mb-3">Locket</Text>
          <Text className="text-white text-2xl text-center">
            Live pics from your friends,{'\n'}on your home screen
          </Text>
        </View>

        {/* Buttons */}
        <View className="w-full mb-10 mt-auto">
          <TouchableOpacity 
            className="bg-yellow-400 rounded-full w-full py-4 px-4 items-center mb-4"
            onPress={() => setCurrentScreen('phone')}
          >
            <Text className="text-black text-xl font-bold">Create an account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="items-center py-3"
            onPress={onLogin}
          >
            <Text className="text-white text-xl">Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPhoneScreen = () => {
    return (
      <View className="flex-1 items-center px-5">
        {/* Header với nút quay lại */}
        <View className="w-full mt-4">
          <TouchableOpacity 
            className="bg-zinc-800 rounded-full w-14 h-14 items-center justify-center"
            onPress={() => setCurrentScreen('welcome')}
          >
            <Text className="text-white text-xl">&lt;</Text>
          </TouchableOpacity>
        </View>

        {/* Form đăng ký */}
        <View className="w-full mt-28 flex-1">
          <Text className="text-white text-4xl font-semibold mb-6 text-center">What's your number?</Text>
          <View className="bg-zinc-800 rounded-full px-5 py-4 flex-row items-center">
            {/* Cờ Mỹ đơn giản */}
            <Text className="text-white text-lg mr-2">🇺🇸</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              className="text-white text-lg flex-1"
              keyboardType="phone-pad"
            />
          </View>
          
          <TouchableOpacity className="bg-zinc-800 self-center mt-5 rounded-full px-8 py-3">
            <Text className="text-white text-base">Use email instead</Text>
          </TouchableOpacity>
          
          <Text className="text-gray-500 text-sm text-center mt-16">
            By tapping Continue, you are agreeing to{'\n'}our <Text className="text-gray-300">Terms of Service</Text> and <Text className="text-gray-300">Privacy Policy</Text>
          </Text>
          
          <TouchableOpacity 
            className="bg-zinc-800 rounded-full w-full py-4 mt-8 px-4 flex-row items-center justify-center"
            onPress={onLogin}
          >
            <Text className="text-white text-lg mr-2">Continue</Text>
            <Text className="text-white text-lg">→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {currentScreen === 'welcome' ? renderWelcomeScreen() : renderPhoneScreen()}
    </SafeAreaView>
  );
}; 