import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/stores/auth-store';
import { View, ActivityIndicator } from 'react-native';
import "./global.css"

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { isAuthenticated, refreshTokens } = useAuthStore();
  
  // On app start, check if the user is authenticated by trying to refresh the token
  useEffect(() => {
    async function prepare() {
      try {
        await refreshTokens();
      } catch (error) {
        console.error('Failed to refresh token:', error);
      } finally {
        setIsReady(true);
      }
    }
    
    prepare();
  }, []);
  
  // Show loading screen while checking authentication
  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }
  
  return (
    <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="welcome" options={{ 
      title: 'Welcome', 
    }} />
    
    <Stack.Screen name="(app)" options={{ 
    }} />
  </Stack>
  );
}
