import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/stores/auth-store';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// UI Components
import { VStack } from "@/components/ui/vstack";
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
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Icon } from "@/components/ui/icon";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { AlertTriangle } from "lucide-react-native";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { HStack } from "@/components/ui/hstack";
import { Toast, ToastTitle, ToastDescription, useToast } from "@/components/ui/toast";

// Schema for form validation
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export default function SignIn() {
  const router = useRouter();
  const { login, isLoading, error, resetError, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  // Handle error messages from the backend
  useEffect(() => {
    if (error) {
      // Parse error message from the backend
      let errorTitle = "Login Failed";
      let errorMessage = error;

      // Handle specific error cases
      if (error.includes('incorrectPassword')) {
        errorMessage = "The password is incorrect. Please try again.";
      } else if (error.includes('notFound')) {
        errorMessage = "Email address not found.";
      } else if (error.includes('needLoginViaProvider')) {
        const provider = error.split(':')[1];
        errorMessage = `Please sign in using ${provider} instead.`;
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
      
      resetError();
    }
  }, [error, toast, resetError]);

  // Navigate to home only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={id} action="success" className='rounded-3xl items-center justify-center'>
              <ToastTitle className='text-center font-bold'>Success</ToastTitle>
              <ToastDescription className='text-center font-bold'>Signed in successfully!</ToastDescription>
            </Toast>
          );
        },
      });
      
      // Navigate to home page after successful login
      router.replace('/(app)/home');
    }
  }, [isAuthenticated, router, toast]);

  const handleState = () => {
    setShowPassword((showState) => !showState);
  };

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(onSignIn)();
  };

  // Handle sign in
  const onSignIn = async (data: LoginSchemaType) => {
    resetError();
    try {
      await login(data.email, data.password);
      // Navigation is handled in the useEffect that watches isAuthenticated
    } catch (error) {
      // Error handling is done in the store
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
                    Login
                  </Heading>
                  <Heading className='text-center mt-1'>Login to start using TrueGift</Heading>
                </VStack>
              </VStack>
              
              <VStack className="w-full">
                <VStack space="xl" className="w-full mt-4">
                  {/* Email Input */}
                  <FormControl isInvalid={!!errors?.email}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input size='lg' variant='rounded'>
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
                  
                  {/* Password Input */}
                  <FormControl isInvalid={!!errors.password}>              
                    <Controller
                      name="password"
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input size='lg' variant='rounded'>
                          <InputField
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={handleKeyPress}
                            returnKeyType="done"                
                          />
                          <InputSlot onPress={handleState} className="pr-3">
                            <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                          </InputSlot>
                        </Input>
                      )}
                    />
                    <FormControlError>
                      <FormControlErrorIcon as={AlertTriangle} />
                      <FormControlErrorText>
                        {errors?.password?.message}
                      </FormControlErrorText>
                    </FormControlError>
                  </FormControl>
                  
                  {/* Forgot Password Link */}
                  <HStack className="w-full justify-end">
                    <Link href="/(auth)/forgot-password" asChild>
                      <Pressable>
                        <LinkText className="font-medium text-md text-primary-700">
                          Forgot Password?
                        </LinkText>
                      </Pressable>
                    </Link>
                  </HStack>
                  
                  {/* Sign In Button */}
                  <Button
                    onPress={handleSubmit(onSignIn)}
                    disabled={isLoading}
                    className='rounded-3xl' size='lg'
                  >
                    {isLoading ? (
                      <ButtonSpinner color={'gray'} />
                    ) : (
                      <ButtonText>Sign In</ButtonText>
                    )}
                  </Button>
                  
                  {/* Sign Up Link */}
                  <HStack space="xs" className="justify-center">
                    <Text className="text-gray-600">
                      Don't have an account?{' '}
                    </Text>
                    <Link href="/(auth)/sign-up" asChild>
                      <Pressable>
                        <LinkText className="font-medium text-gray-700">
                          Sign up
                        </LinkText>
                      </Pressable>
                    </Link>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>
          </VStack>
        </HStack>
      </ScrollView>
    </SafeAreaView>
  );
}
