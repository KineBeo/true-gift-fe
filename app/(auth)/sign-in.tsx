import { View, Text, SafeAreaView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useForm } from '../../lib/hooks/useForm';
import { required, isEmail } from '../../lib/utils/validations';
import { useAuthStore } from '../../lib/stores/auth-store';

interface SignInForm {
  email: string;
  password: string;
}

export default function SignIn() {
  const router = useRouter();
  const { login, isLoading, error, resetError } = useAuthStore();
  
  // Form validation
  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur, 
    validateForm 
  } = useForm<SignInForm>({
    email: '',
    password: '',
  }, {
    email: [
      required('Email is required'),
      isEmail('Please enter a valid email address'),
    ],
    password: [
      required('Password is required'),
    ],
  });

  // Handle sign in
  const handleSignIn = async () => {
    resetError();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(values.email, values.password);
      router.replace('/(app)/home');
    } catch (error) {
      // Error handling is done in the store
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="p-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Feather name="arrow-left" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          
          {/* Form Container */}
          <View className="flex-1 px-6 pt-4">
            <Text className="text-3xl font-bold text-gray-800 mb-8">
              Welcome back
            </Text>
            
            {/* Error Message */}
            {error && (
              <View className="mb-4 p-3 bg-red-50 rounded-lg">
                <Text className="text-red-500">{error}</Text>
              </View>
            )}
            
            {/* Email Input */}
            <Input
              label="Email"
              placeholder="Enter your email"
              value={values.email}
              onChangeText={(text) => handleChange('email', text)}
              onBlur={() => handleBlur('email')}
              error={touched.email ? errors.email : undefined}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<Feather name="mail" size={18} color="#6B7280" />}
              type="email"
            />
            
            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Enter your password"
              value={values.password}
              onChangeText={(text) => handleChange('password', text)}
              onBlur={() => handleBlur('password')}
              error={touched.password ? errors.password : undefined}
              type="password"
              icon={<Feather name="lock" size={18} color="#6B7280" />}
            />
            
            {/* Forgot Password Link */}
            <View className="items-end mb-6">
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text className="text-amber-500 font-medium">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
            
            {/* Sign In Button */}
            <Button
              onPress={handleSignIn}
              fullWidth
              isLoading={isLoading}
            >
              Sign In
            </Button>
            
            {/* Sign Up Link */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-gray-600">
                Don't have an account?{' '}
              </Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="text-amber-500 font-medium">
                    Sign up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
