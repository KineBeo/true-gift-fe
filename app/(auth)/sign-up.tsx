import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/stores/auth-store';
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
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Icon } from "@/components/ui/icon";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { AlertTriangle } from "lucide-react-native";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { Toast, ToastTitle, ToastDescription, useToast } from "@/components/ui/toast";

// Schema for form validation
const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(new RegExp(".*[A-Z].*"), "Must contain one uppercase character")
    .regex(new RegExp(".*[a-z].*"), "Must contain one lowercase character")
    .regex(new RegExp(".*\\d.*"), "Must contain one number")
    .regex(new RegExp(".*[`~<>?,./!@#$%^&*()\\-_+=\"'|{}\\[\\];:\\\\].*"), "Must contain one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type SignUpSchemaType = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const router = useRouter();
  const { register, isLoading, error, resetError, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  // Handle error messages from the backend
  useEffect(() => {
    if (error) {
      // Parse error message from the backend
      let errorTitle = "Registration Failed";
      let errorMessage = error;

      // Handle specific error cases
      if (error.includes('exists') || error.includes('duplicate')) {
        errorMessage = "An account with this email already exists.";
      } else if (error.includes('validation')) {
        errorMessage = "Please check your information and try again.";
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
              <ToastDescription className='text-center font-bold'>Account created successfully!</ToastDescription>
            </Toast>
          );
        },
      });
      
      // Navigate to home page after successful registration
      router.replace('/(app)/home');
    }
  }, [isAuthenticated, router, toast]);

  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
  };

  const handleConfirmPasswordToggle = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(onSignUp)();
  };

  // Handle sign up
  const onSignUp = async (data: SignUpSchemaType) => {
    resetError();
    
    try {
      await register(
        data.email, 
        data.password, 
        data.firstName, 
        data.lastName
      );
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
                    Sign up
                  </Heading>
                  <Heading className='text-center mt-1'>Sign up and start using TrueGift</Heading>
                </VStack>
              </VStack>
              
              <VStack className="w-full">
                <VStack space="xl" className="w-full">
                  {/* Name fields in a row */}
                  <HStack space="md">
                    {/* First Name Input */}
                    <FormControl isInvalid={!!errors?.firstName} className="flex-1">
                      <Controller
                        name="firstName"
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input className='rounded-3xl' size='lg'>
                            <InputField
                              placeholder="First name"
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              autoCapitalize="words"
                            />
                          </Input>
                        )}
                      />
                      <FormControlError>
                        <FormControlErrorIcon as={AlertTriangle} />
                        <FormControlErrorText>
                          {errors?.firstName?.message}
                        </FormControlErrorText>
                      </FormControlError>
                    </FormControl>
                    
                    {/* Last Name Input */}
                    <FormControl isInvalid={!!errors?.lastName} className="flex-1">
                      <Controller
                        name="lastName"
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input className='rounded-3xl' size='lg'>
                            <InputField
                              placeholder="Last name"
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              autoCapitalize="words"
                            />
                          </Input>
                        )}
                      />
                      <FormControlError>
                        <FormControlErrorIcon as={AlertTriangle} />
                        <FormControlErrorText>
                          {errors?.lastName?.message}
                        </FormControlErrorText>
                      </FormControlError>
                    </FormControl>
                  </HStack>
                  
                  {/* Email Input */}
                  <FormControl isInvalid={!!errors?.email}>
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
                        <Input className='rounded-3xl' size='lg'>
                          <InputField
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                          />
                          <InputSlot onPress={handlePasswordToggle} className="pr-3">
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
                  
                  {/* Confirm Password Input */}
                  <FormControl isInvalid={!!errors.confirmPassword}>
                    <Controller
                      name="confirmPassword"
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input className='rounded-3xl' size='lg'>
                          <InputField
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                          />
                          <InputSlot onPress={handleConfirmPasswordToggle} className="pr-3">
                            <InputIcon as={showConfirmPassword ? EyeIcon : EyeOffIcon} />
                          </InputSlot>
                        </Input>
                      )}
                    />
                    <FormControlError>
                      <FormControlErrorIcon as={AlertTriangle} />
                      <FormControlErrorText>
                        {errors?.confirmPassword?.message}
                      </FormControlErrorText>
                    </FormControlError>
                  </FormControl>
                  
                  {/* Terms and Conditions */}
                  {/* <Text className="text-gray-500 text-xs text-center">
                    By signing up, you agree to our{' '}
                    <LinkText className="text-primary-600">Terms of Service</LinkText> and{' '}
                    <LinkText className="text-primary-600">Privacy Policy</LinkText>
                  </Text> */}
                  
                  {/* Sign Up Button */}
                  <Button
                    onPress={handleSubmit(onSignUp)}
                    disabled={isLoading}
                    className='rounded-3xl' 
                    size='lg'
                  >
                    {isLoading ? (
                      <ButtonSpinner color={'gray'} />
                    ) : (
                      <ButtonText>Create Account</ButtonText>
                    )}
                  </Button>
                  
                  {/* Sign In Link */}
                  <HStack space="xs" className="justify-center">
                    <Text className="text-gray-600">
                      Already have an account?{' '}
                    </Text>
                    <Link href="/(auth)/sign-in" asChild>
                      <Pressable>
                        <LinkText className="font-medium text-gray-700">
                          Sign in
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
