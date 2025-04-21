import { Stack, Tabs } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/stores/auth-store';
import { View } from 'react-native';
import { useEffect } from 'react';
import { apiService } from '../../lib/services/api';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();
  
  // This layout will only be rendered if we're in the app section,
  // which is protected by the auth check in the home screen.
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >  
    </Stack>
  );
}