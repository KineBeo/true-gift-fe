import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

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
      Alert.alert('Đăng ký thành công', 'Vui lòng kiểm tra email để xác nhận tài khoản', [
        { text: 'OK', onPress: () => setCurrentScreen('email-login') },
      ]);
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
        <View className="flex-1 items-center justify-center">
          <View className="mb-8 h-64 w-64">
            <View className="h-full w-full items-center justify-center rounded-[40px] border-2 border-zinc-700 bg-zinc-800">
              <View className="relative h-full w-full grid-cols-4 grid-rows-4">
                {/* Hiển thị các nút giả */}
                <View className="absolute left-8 top-20 h-14 w-14 rounded-lg bg-zinc-700" />
                <View className="absolute left-8 top-36 h-14 w-14 rounded-lg bg-zinc-700" />
                <View className="absolute left-24 top-20 h-14 w-14 rounded-lg bg-zinc-700" />
                <View className="absolute left-24 top-36 h-14 w-14 rounded-lg bg-zinc-700" />
                <View className="absolute left-40 top-20 h-14 w-14 rounded-lg bg-zinc-700" />
                <View className="absolute left-40 top-36 h-14 w-14 rounded-lg bg-zinc-700" />
                <View className="absolute left-24 top-52 h-14 w-14 rounded-lg bg-zinc-700" />

                {/* Ảnh người dùng nổi bật */}
                <View className="absolute left-40 top-36 h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-yellow-500 bg-yellow-500">
                  <Text className="text-[8px] text-black">Ảnh</Text>
                </View>
              </View>
            </View>
          </View>
          <Text className="mb-3 text-4xl font-bold text-white">TrueGift</Text>
          <Text className="text-center text-2xl text-white">
            Chia sẻ khoảnh khắc{'\n'}với bạn bè yêu thương
          </Text>
        </View>

        {/* Buttons */}
        <View className="mb-10 mt-auto w-full">
          <TouchableOpacity
            className="mb-4 w-full items-center rounded-full bg-yellow-400 px-4 py-4"
            onPress={() => setCurrentScreen('email-register')}>
            <Text className="text-xl font-bold text-black">Tạo tài khoản</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center py-3"
            onPress={() => setCurrentScreen('email-login')}>
            <Text className="text-xl text-white">Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPhoneScreen = () => {
    return (
      <View className="flex-1 items-center px-5">
        {/* Header với nút quay lại */}
        <View className="mt-4 w-full">
          <TouchableOpacity
            className="h-14 w-14 items-center justify-center rounded-full bg-zinc-800"
            onPress={() => setCurrentScreen('welcome')}>
            <Text className="text-xl text-white">&lt;</Text>
          </TouchableOpacity>
        </View>

        {/* Form đăng ký */}
        <View className="mt-28 w-full flex-1">
          <Text className="mb-6 text-center text-4xl font-semibold text-white">
            Số điện thoại của bạn?
          </Text>
          <View className="flex-row items-center rounded-full bg-zinc-800 px-5 py-4">
            {/* Cờ Việt Nam đơn giản */}
            <Text className="mr-2 text-lg text-white">🇻🇳</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              className="flex-1 text-lg text-white"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            className="mt-5 self-center rounded-full bg-zinc-800 px-8 py-3"
            onPress={() => setCurrentScreen('email-login')}>
            <Text className="text-base text-white">Dùng email thay thế</Text>
          </TouchableOpacity>

          <Text className="mt-16 text-center text-sm text-gray-500">
            Bằng cách nhấn Tiếp tục, bạn đồng ý với{'\n'}
            <Text className="text-gray-300">Điều khoản dịch vụ</Text> và{' '}
            <Text className="text-gray-300">Chính sách quyền riêng tư</Text>
          </Text>

          <TouchableOpacity
            className="mt-8 w-full flex-row items-center justify-center rounded-full bg-zinc-800 px-4 py-4"
            onPress={onLogin}>
            <Text className="mr-2 text-lg text-white">Tiếp tục</Text>
            <Text className="text-lg text-white">→</Text>
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
          <View className="mt-4 w-full">
            <TouchableOpacity
              className="h-14 w-14 items-center justify-center rounded-full bg-zinc-800"
              onPress={() => setCurrentScreen('welcome')}
              disabled={loading}>
              <Text className="text-xl text-white">&lt;</Text>
            </TouchableOpacity>
          </View>

          {/* Form đăng nhập */}
          <View className="mt-20 w-full">
            <Text className="mb-8 text-center text-4xl font-semibold text-white">Đăng nhập</Text>

            {error && (
              <View className="mb-4 rounded-xl bg-red-500/20 px-4 py-3">
                <Text className="text-red-500">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-2 ml-2 text-base text-white">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="rounded-full bg-zinc-800 px-5 py-4 text-lg text-white"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View className="mb-6">
              <Text className="mb-2 ml-2 text-base text-white">Mật khẩu</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                className="rounded-full bg-zinc-800 px-5 py-4 text-lg text-white"
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              className="mb-6 self-center"
              onPress={() => setCurrentScreen('email-register')}
              disabled={loading}>
              <Text className="text-yellow-400">Chưa có tài khoản? Đăng ký</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`w-full items-center rounded-full bg-yellow-400 px-4 py-4 ${loading ? 'opacity-70' : ''}`}
              onPress={handleLoginSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-xl font-bold text-black">Đăng nhập</Text>
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
          <View className="mt-4 w-full">
            <TouchableOpacity
              className="h-14 w-14 items-center justify-center rounded-full bg-zinc-800"
              onPress={() => setCurrentScreen('welcome')}
              disabled={loading}>
              <Text className="text-xl text-white">&lt;</Text>
            </TouchableOpacity>
          </View>

          {/* Form đăng ký */}
          <View className="mt-12 w-full">
            <Text className="mb-8 text-center text-4xl font-semibold text-white">Đăng ký</Text>

            {error && (
              <View className="mb-4 rounded-xl bg-red-500/20 px-4 py-3">
                <Text className="text-red-500">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-2 ml-2 text-base text-white">Họ</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                className="rounded-full bg-zinc-800 px-5 py-4 text-lg text-white"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 ml-2 text-base text-white">Tên</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                className="rounded-full bg-zinc-800 px-5 py-4 text-lg text-white"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 ml-2 text-base text-white">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="rounded-full bg-zinc-800 px-5 py-4 text-lg text-white"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 ml-2 text-base text-white">Mật khẩu</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                className="rounded-full bg-zinc-800 px-5 py-4 text-lg text-white"
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View className="mb-6">
              <Text className="mb-2 ml-2 text-base text-white">Xác nhận mật khẩu</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                className="rounded-full bg-zinc-800 px-5 py-4 text-lg text-white"
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              className="mb-6 self-center"
              onPress={() => setCurrentScreen('email-login')}
              disabled={loading}>
              <Text className="text-yellow-400">Đã có tài khoản? Đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`w-full items-center rounded-full bg-yellow-400 px-4 py-4 ${loading ? 'opacity-70' : ''}`}
              onPress={handleRegisterSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-xl font-bold text-black">Đăng ký</Text>
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
