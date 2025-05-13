import React, { useState } from 'react';
import { 
  TextInput, 
  View, 
  Text, 
  TextInputProps, 
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { classNames } from '../../../lib/utils/classNames';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  type?: 'text' | 'password' | 'email';
  className?: string;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Determine keyboard type based on input type
  const getKeyboardType = (): KeyboardTypeOptions => {
    switch (type) {
      case 'email':
        return 'email-address';
      default:
        return 'default';
    }
  };
  
  // Show or hide text in password field
  const isPassword = type === 'password';
  const secureTextEntry = isPassword && !showPassword;
  
  return (
    <View className={classNames('mb-4', containerClassName)}>
      {label && (
        <Text className="text-gray-700 font-medium mb-1 text-sm">
          {label}
        </Text>
      )}
      
      <View 
        className={classNames(
          'flex-row items-center border rounded-lg px-3 py-2 bg-white',
          isFocused ? 'border-amber-400' : 'border-gray-300',
          error ? 'border-red-500' : '',
          'relative'
        )}
      >
        {icon && (
          <View className="mr-2">
            {icon}
          </View>
        )}
        
        <TextInput
          className={classNames(
            'flex-1 text-base text-gray-800 font-normal',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={getKeyboardType()}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2 p-1"
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-red-500 text-xs mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}; 