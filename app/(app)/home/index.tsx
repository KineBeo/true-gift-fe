import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/welcome');
    }
  }, [isAuthenticated]);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    try {
      // We could refresh user data here if needed
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };
  
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerClassName="flex-grow"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2 flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-800">TrueGift</Text>
          
          <TouchableOpacity 
            onPress={handleLogout}
            className="p-2 rounded-full"
          >
            <Feather name="log-out" size={22} color="#F59E0B" />
          </TouchableOpacity>
        </View>
        
        {/* User Profile Card */}
        <View className="mx-6 mt-4 p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <View className="flex-row space-x-4 items-center">
            {/* User Avatar */}
            <View className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center">
              {user.photo ? (
                <Image 
                  source={{ uri: user.photo }} 
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-2xl font-bold text-amber-500">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </Text>
              )}
            </View>
            
            {/* User Info */}
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">
                {user.firstName} {user.lastName}
              </Text>
              <Text className="text-gray-500">{user.email}</Text>
            </View>
          </View>
        </View>
        
        {/* Welcome Message */}
        <View className="mx-6 mt-8">
          <Text className="text-lg text-gray-700">
            Welcome to TrueGift! Your gift-giving experience starts here.
          </Text>
        </View>
        
        {/* Quick Actions */}
        <View className="mx-6 mt-6">
          <Text className="text-lg font-semibold mb-4">Quick Actions</Text>
          
          <View className="grid grid-cols-2 gap-4">
            {/* Create Wish List Button */}
            <TouchableOpacity
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-center"
              onPress={() => {
                // Navigate to wish list creation
              }}
            >
              <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mb-2">
                <MaterialIcons name="list-alt" size={24} color="#F59E0B" />
              </View>
              <Text className="text-gray-800 font-medium">Create Wish List</Text>
            </TouchableOpacity>
            
            {/* Add Friends Button */}
            <TouchableOpacity
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-center"
              onPress={() => {
                // Navigate to friends screen
              }}
            >
              <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mb-2">
                <MaterialIcons name="person-add" size={24} color="#F59E0B" />
              </View>
              <Text className="text-gray-800 font-medium">Add Friends</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Development Info - You can remove this in production
        <View className="mx-6 mt-12 p-4 bg-gray-50 rounded-lg">
          <Text className="text-xs text-gray-500">
            User ID: {user.id}
          </Text>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}
