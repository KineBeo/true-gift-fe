import React, { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../lib/config/environment';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// UI Components
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { LinkText } from "@/components/ui/link";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { ArrowLeftIcon, CheckIcon, Icon } from "@/components/ui/icon";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { AlertTriangle } from "lucide-react-native";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { Toast, ToastTitle, ToastDescription, useToast } from "@/components/ui/toast";

// Schema for form validation
const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  // Handle error messages
  useEffect(() => {
    if (error) {
      // Parse error message
      let errorTitle = "Password Reset Failed";
      let errorMessage = error;

      // Handle specific error cases
      if (error.includes('emailNotExists')) {
        errorMessage = "No account found with this email address.";
      } else if (error.includes('tooManyRequests')) {
        errorMessage = "Too many reset attempts. Please try again later.";
      }

      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={id} action="error" className='rounded-3xl items-center justify-center'>
              <ToastTitle className='text-center font-bold'>{errorTitle}</ToastTitle>
              <ToastDescription className='text-center font-bold'>{errorMessage}</ToastDescription>
            </Toast>
          );
        },
      });
      
      setError(null);
    }
  }, [error, toast]);

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(onForgotPassword)();
  };

  // Handle forgot password
  const onForgotPassword = async (data: ForgotPasswordSchemaType) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await axios.post(`${API_URL}/auth/forgot/password`, {
        email: data.email,
      });
      
      setSuccess(true);
      
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={id} action="success" className='rounded-3xl items-center justify-center'>
              <ToastTitle className='text-center font-bold'>Email Sent</ToastTitle>
              <ToastDescription className='text-center font-bold'>Password reset instructions have been sent to your email.</ToastDescription>
            </Toast>
          );
        },
      });
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
    <SafeAreaView className="w-full h-full">
      <ScrollView
        className="w-full h-full"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <HStack className="w-full h-full bg-background-0 flex-grow justify-center">
          <VStack className="md:items-center md:justify-center flex-1 w-full p-9 md:gap-10 gap-16 md:m-auto md:w-1/2 h-full">
            <VStack className="max-w-[440px] w-full" space="md">
              <VStack className="md:items-center" space="md">
                <Pressable
                  onPress={() => {
                    router.back();
                  }}
                >
                  <Icon
                    as={ArrowLeftIcon}
                    className="md:hidden text-background-800"
                    size="xl"
                  />
                </Pressable>
                <VStack>
                  <Heading className="text-center" size="3xl">
                    Forgot Password?
                  </Heading>
                  {!success ? (
                    <Heading className='text-center mt-1'>
                      Enter email ID associated with your account.
                    </Heading>
                  ) : null}
                </VStack>
              </VStack>
              
              {!success ? (
                <VStack className="w-full">
                  <VStack space="xl" className="w-full">
                    {/* Email Input */}
                    <FormControl isInvalid={!!errors?.email} className="w-full">
                      <FormControlLabel>
                        <FormControlLabelText>Email</FormControlLabelText>
                      </FormControlLabel>
                      <Controller
                        name="email"
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input className='rounded-3xl' size='lg'>
                            <InputField
                              placeholder="Enter email"
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              onSubmitEditing={handleKeyPress}
                              returnKeyType="done"
                              autoCapitalize="none"
                              keyboardType="email-address"
                            />
                          </Input>
                        )}
                      />
                      <FormControlError>
                        <FormControlErrorIcon as={AlertTriangle} />
                        <FormControlErrorText>
                          {errors?.email?.message}
                        </FormControlErrorText>
                      </FormControlError>
                    </FormControl>
                    
                    {/* Send Link Button */}
                    <Button 
                      onPress={handleSubmit(onForgotPassword)}
                      disabled={isLoading}
                      className='rounded-3xl'
                      size='lg'
                    >
                      {isLoading ? (
                        <ButtonSpinner color={'gray'} />
                      ) : (
                        <ButtonText>Send Link</ButtonText>
                      )}
                    </Button>
                  </VStack>
                </VStack>
              ) : (
                <VStack space="xl" className="w-full items-center">
                  <VStack 
                    className="w-16 h-16 rounded-full bg-green-100 items-center justify-center"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <Icon
                      as={CheckIcon}
                      size="xl"
                      color="green"
                    />
                  </VStack>
                  
                  <VStack space="xs" className="items-center">
                    <Heading size="lg" className="text-center">
                      Check Your Email
                    </Heading>
                    
                    <Text className="text-center">
                      We've sent instructions to reset your password to {getValues('email')}
                    </Text>
                  </VStack>
                  
                  <Button
                    onPress={() => router.replace('/(auth)/sign-in')}
                    variant="outline"
                    className='rounded-3xl'
                    size='lg'
                  >
                    <ButtonText>Back to Sign In</ButtonText>
                  </Button>
                </VStack>
              )}
            </VStack>
          </VStack>
        </HStack>
      </ScrollView>
    </SafeAreaView>
  );
}
