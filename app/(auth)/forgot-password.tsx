import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useForm } from '../../lib/hooks/useForm';
import { required, isEmail } from '../../lib/utils/validations';
import axios from 'axios';
import { API_URL } from '../../lib/config/environment';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form validation
  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur, 
    validateForm 
  } = useForm<ForgotPasswordForm>({
    email: '',
  }, {
    email: [
      required('Email is required'),
      isEmail('Please enter a valid email address'),
    ],
  });

  // Handle forgot password
  const handleForgotPassword = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await axios.post(`${API_URL}/auth/forgot/password`, {
        email: values.email,
      });
      
      setSuccess(true);
    } catch (error) {
      const errorMessage = 
        axios.isAxiosError(error) && error.response?.data?.message 
          ? error.response.data.message 
          : 'Failed to process your request. Please try again.';
        
      console.error('Forgot password error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
            <Text className="text-3xl font-bold text-gray-800 mb-4">
              Reset Password
            </Text>
            
            {!success ? (
              <>
                <Text className="text-gray-600 mb-8">
                  Enter your email address and we'll send you instructions to reset your password.
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
                
                {/* Reset Button */}
                <View className="mt-6">
                  <Button
                    onPress={handleForgotPassword}
                    fullWidth
                    isLoading={isLoading}
                  >
                    Reset Password
                  </Button>
                </View>
              </>
            ) : (
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                  <Feather name="check" size={32} color="#10B981" />
                </View>
                
                <Text className="text-xl font-semibold text-gray-800 mb-2 text-center">
                  Check Your Email
                </Text>
                
                <Text className="text-gray-600 mb-8 text-center">
                  We've sent instructions to reset your password to {values.email}
                </Text>
                
                <Button
                  onPress={() => router.replace('/(auth)/sign-in')}
                  variant="outline"
                >
                  Back to Sign In
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
