import { View, Text, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useForm } from '../../lib/hooks/useForm';
import { required, isEmail, minLength, passwordComplexity, passwordsMatch } from '../../lib/utils/validations';
import { useAuthStore } from '../../lib/stores/auth-store';

interface SignUpForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUp() {
  const router = useRouter();
  const { register, isLoading, error, resetError } = useAuthStore();
  
  // Form validation
  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur, 
    validateForm 
  } = useForm<SignUpForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  }, {
    firstName: [
      required('First name is required'),
    ],
    lastName: [
      required('Last name is required'),
    ],
    email: [
      required('Email is required'),
      isEmail('Please enter a valid email address'),
    ],
    password: [
      required('Password is required'),
      minLength(8, 'Password must be at least 8 characters'),
      passwordComplexity(),
    ],
    confirmPassword: [
      required('Please confirm your password'),
      passwordsMatch('Passwords do not match'),
    ],
  });

  // Handle sign up
  const handleSignUp = async () => {
    resetError();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await register(
        values.email, 
        values.password, 
        values.firstName, 
        values.lastName
      );
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
          <View className="flex-1 px-6 pt-2 pb-8">
            <Text className="text-3xl font-bold text-gray-800 mb-6">
              Create account
            </Text>
            
            {/* Error Message */}
            {error && (
              <View className="mb-4 p-3 bg-red-50 rounded-lg">
                <Text className="text-red-500">{error}</Text>
              </View>
            )}
            
            {/* Name fields in a row */}
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Input
                  label="First Name"
                  placeholder="John"
                  value={values.firstName}
                  onChangeText={(text) => handleChange('firstName', text)}
                  onBlur={() => handleBlur('firstName')}
                  error={touched.firstName ? errors.firstName : undefined}
                  autoCapitalize="words"
                />
              </View>
              
              <View className="flex-1">
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={values.lastName}
                  onChangeText={(text) => handleChange('lastName', text)}
                  onBlur={() => handleBlur('lastName')}
                  error={touched.lastName ? errors.lastName : undefined}
                  autoCapitalize="words"
                />
              </View>
            </View>
            
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
              placeholder="Create a password"
              value={values.password}
              onChangeText={(text) => handleChange('password', text)}
              onBlur={() => handleBlur('password')}
              error={touched.password ? errors.password : undefined}
              type="password"
              icon={<Feather name="lock" size={18} color="#6B7280" />}
            />
            
            {/* Confirm Password Input */}
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={values.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              onBlur={() => handleBlur('confirmPassword')}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              type="password"
              icon={<Feather name="lock" size={18} color="#6B7280" />}
            />
            
            {/* Sign Up Button */}
            <View className="mt-4">
              <Button
                onPress={handleSignUp}
                fullWidth
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </View>
            
            {/* Terms and Conditions */}
            <Text className="text-gray-500 text-xs text-center mt-6">
              By signing up, you agree to our{' '}
              <Text className="text-amber-500">Terms of Service</Text> and{' '}
              <Text className="text-amber-500">Privacy Policy</Text>
            </Text>
            
            {/* Sign In Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text className="text-amber-500 font-medium">
                    Sign in
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
