import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { SignupScreen } from './components/SignupScreen';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { ConversationsScreen } from './components/ConversationsScreen';
import { checkAuthStatus, logout } from './services/api';

import './global.css';

// Định nghĩa các loại màn hình trong ứng dụng
type Screen = 'home' | 'chat' | 'conversations' | 'login';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [chatProps, setChatProps] = useState({
    friendId: 0,
    friendName: '',
    friendEmail: ''
  });

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setLoading(true);
        const status = await checkAuthStatus();
        setIsLoggedIn(status);
        setCurrentScreen(status ? 'home' : 'login');
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        setIsLoggedIn(false);
        setCurrentScreen('login');
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('home');
  };
  
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setIsLoggedIn(false);
      setCurrentScreen('login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      Alert.alert('Lỗi đăng xuất', 'Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenChat = (friendId: number, friendName: string, friendEmail: string) => {
    setChatProps({
      friendId,
      friendName,
      friendEmail
    });
    setCurrentScreen('chat');
  };
  
  const handleOpenConversations = () => {
    setCurrentScreen('conversations');
  };
  
  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FFBB00" />
        <Text className="text-white mt-4">Đang tải...</Text>
      </View>
    );
  }
  
  // Hiển thị màn hình phù hợp dựa trên trạng thái hiện tại
  const renderScreen = () => {
    if (!isLoggedIn) {
      return <SignupScreen onLogin={handleLogin} />;
    }
    
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen 
            onLogout={handleLogout} 
            onOpenChat={handleOpenChat}
            onOpenConversations={handleOpenConversations}
          />
        );
      case 'chat':
        return (
          <ChatScreen 
            friendId={chatProps.friendId}
            friendName={chatProps.friendName}
            friendEmail={chatProps.friendEmail}
            onBack={handleBackToHome}
          />
        );
      case 'conversations':
        return (
          <ConversationsScreen
            onBack={handleBackToHome}
            onOpenChat={handleOpenChat}
          />
        );
      default:
        return (
          <HomeScreen 
            onLogout={handleLogout} 
            onOpenChat={handleOpenChat}
            onOpenConversations={handleOpenConversations}
          />
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <StatusBar style="light" />
    </>
  );
}
