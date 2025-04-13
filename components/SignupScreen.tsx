import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { login, register } from '../services/api';

interface SignupScreenProps {
  onLogin: () => void;
}

type ScreenType = 'welcome' | 'phone' | 'email-login' | 'email-register';

export const SignupScreen = ({ onLogin }: SignupScreenProps) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('welcome');
  
  // Thông tin đăng nhập
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Thông tin đăng ký
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('+1 201-555-0123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    // Xóa thông báo lỗi cũ nếu có
    setError(null);
    setLoading(true);
    
    try {
      await login(email, password);
      onLogin();
    } catch (error: any) {
      console.error('Lỗi đăng nhập:', error);
      
      // Hiển thị lỗi phù hợp cho người dùng
      if (typeof error === 'object' && error.message) {
        if (error.statusCode === 422) {
          setError('Email hoặc mật khẩu không đúng');
        } else if (error.statusCode === 401) {
          setError('Tài khoản chưa được xác nhận. Vui lòng kiểm tra email');
        } else {
          setError(error.message || 'Đã có lỗi xảy ra');
        } 
      } else {
        setError('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    // Xóa thông báo lỗi cũ nếu có
    setError(null);
    setLoading(true);

    try {
      await register(email, password, firstName, lastName);
      Alert.alert(
        'Đăng ký thành công', 
        'Vui lòng kiểm tra email để xác nhận tài khoản',
        [{ text: 'OK', onPress: () => setCurrentScreen('email-login') }]
      );
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);

      // Hiển thị lỗi phù hợp cho người dùng
      if (typeof error === 'object' && error.message) {
        if (error.statusCode === 422) {
          setError('Email này đã được sử dụng');
        } else {
          setError(error.message || 'Đã có lỗi xảy ra');
        }
      } else {
        setError('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          <Text className="text-white text-4xl font-bold mb-3">TrueGift</Text>
          <Text className="text-white text-2xl text-center">
            Chia sẻ khoảnh khắc{'\n'}với bạn bè yêu thương
          </Text>
        </View>

        {/* Buttons */}
        <View className="w-full mb-10 mt-auto">
          <TouchableOpacity 
            className="bg-yellow-400 rounded-full w-full py-4 px-4 items-center mb-4"
            onPress={() => setCurrentScreen('email-register')}
          >
            <Text className="text-black text-xl font-bold">Tạo tài khoản</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="items-center py-3"
            onPress={() => setCurrentScreen('email-login')}
          >
            <Text className="text-white text-xl">Đăng nhập</Text>
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
          <Text className="text-white text-4xl font-semibold mb-6 text-center">Số điện thoại của bạn?</Text>
          <View className="bg-zinc-800 rounded-full px-5 py-4 flex-row items-center">
            {/* Cờ Việt Nam đơn giản */}
            <Text className="text-white text-lg mr-2">🇻🇳</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              className="text-white text-lg flex-1"
              keyboardType="phone-pad"
            />
          </View>
          
          <TouchableOpacity 
            className="bg-zinc-800 self-center mt-5 rounded-full px-8 py-3"
            onPress={() => setCurrentScreen('email-login')}
          >
            <Text className="text-white text-base">Dùng email thay thế</Text>
          </TouchableOpacity>
          
          <Text className="text-gray-500 text-sm text-center mt-16">
            Bằng cách nhấn Tiếp tục, bạn đồng ý với{'\n'}<Text className="text-gray-300">Điều khoản dịch vụ</Text> và <Text className="text-gray-300">Chính sách quyền riêng tư</Text>
          </Text>
          
          <TouchableOpacity 
            className="bg-zinc-800 rounded-full w-full py-4 mt-8 px-4 flex-row items-center justify-center"
            onPress={onLogin}
          >
            <Text className="text-white text-lg mr-2">Tiếp tục</Text>
            <Text className="text-white text-lg">→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmailLoginScreen = () => {
    return (
      <ScrollView className="flex-1">
        <View className="flex-1 items-center px-5 pb-10">
          {/* Header với nút quay lại */}
          <View className="w-full mt-4">
            <TouchableOpacity 
              className="bg-zinc-800 rounded-full w-14 h-14 items-center justify-center"
              onPress={() => setCurrentScreen('welcome')}
              disabled={loading}
            >
              <Text className="text-white text-xl">&lt;</Text>
            </TouchableOpacity>
          </View>

          {/* Form đăng nhập */}
          <View className="w-full mt-20">
            <Text className="text-white text-4xl font-semibold mb-8 text-center">Đăng nhập</Text>
            
            {error && (
              <View className="mb-4 bg-red-500/20 px-4 py-3 rounded-xl">
                <Text className="text-red-500">{error}</Text>
              </View>
            )}
            
            <View className="mb-4">
              <Text className="text-white text-base mb-2 ml-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="bg-zinc-800 text-white text-lg px-5 py-4 rounded-full"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-white text-base mb-2 ml-2">Mật khẩu</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                className="bg-zinc-800 text-white text-lg px-5 py-4 rounded-full"
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity 
              className="self-center mb-6"
              onPress={() => setCurrentScreen('email-register')}
              disabled={loading}
            >
              <Text className="text-yellow-400">Chưa có tài khoản? Đăng ký</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`bg-yellow-400 rounded-full w-full py-4 px-4 items-center ${loading ? 'opacity-70' : ''}`}
              onPress={handleLoginSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-black text-xl font-bold">Đăng nhập</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderEmailRegisterScreen = () => {
    return (
      <ScrollView className="flex-1">
        <View className="flex-1 items-center px-5 pb-10">
          {/* Header với nút quay lại */}
          <View className="w-full mt-4">
            <TouchableOpacity 
              className="bg-zinc-800 rounded-full w-14 h-14 items-center justify-center"
              onPress={() => setCurrentScreen('welcome')}
              disabled={loading}
            >
              <Text className="text-white text-xl">&lt;</Text>
            </TouchableOpacity>
          </View>

          {/* Form đăng ký */}
          <View className="w-full mt-12">
            <Text className="text-white text-4xl font-semibold mb-8 text-center">Đăng ký</Text>
            
            {error && (
              <View className="mb-4 bg-red-500/20 px-4 py-3 rounded-xl">
                <Text className="text-red-500">{error}</Text>
              </View>
            )}
            
            <View className="mb-4">
              <Text className="text-white text-base mb-2 ml-2">Họ</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                className="bg-zinc-800 text-white text-lg px-5 py-4 rounded-full"
                editable={!loading}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-white text-base mb-2 ml-2">Tên</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                className="bg-zinc-800 text-white text-lg px-5 py-4 rounded-full"
                editable={!loading}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-white text-base mb-2 ml-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="bg-zinc-800 text-white text-lg px-5 py-4 rounded-full"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-white text-base mb-2 ml-2">Mật khẩu</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                className="bg-zinc-800 text-white text-lg px-5 py-4 rounded-full"
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-white text-base mb-2 ml-2">Xác nhận mật khẩu</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                className="bg-zinc-800 text-white text-lg px-5 py-4 rounded-full"
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity 
              className="self-center mb-6"
              onPress={() => setCurrentScreen('email-login')}
              disabled={loading}
            >
              <Text className="text-yellow-400">Đã có tài khoản? Đăng nhập</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`bg-yellow-400 rounded-full w-full py-4 px-4 items-center ${loading ? 'opacity-70' : ''}`}
              onPress={handleRegisterSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-black text-xl font-bold">Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {currentScreen === 'welcome' && renderWelcomeScreen()}
      {currentScreen === 'phone' && renderPhoneScreen()}
      {currentScreen === 'email-login' && renderEmailLoginScreen()}
      {currentScreen === 'email-register' && renderEmailRegisterScreen()}
    </SafeAreaView>
  );
}; 