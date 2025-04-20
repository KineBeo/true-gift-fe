import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  TouchableOpacityProps,
  View
} from 'react-native';
import { classNames } from '../../lib/utils/classNames';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  // Base styles
  const baseStyles = 'flex flex-row items-center justify-center rounded-full';
  
  // Size variants
  const sizeStyles = {
    sm: 'py-2 px-4',
    md: 'py-3 px-6',
    lg: 'py-4 px-8',
  };
  
  // Color variants
  const variants = {
    primary: 'bg-amber-400 active:bg-amber-500',
    secondary: 'bg-gray-200 active:bg-gray-300',
    outline: 'border border-amber-400 active:bg-amber-50',
  };
  
  // Text colors
  const textVariants = {
    primary: 'text-black font-semibold',
    secondary: 'text-gray-800 font-semibold',
    outline: 'text-amber-400 font-semibold',
  };
  
  // Sizes
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';
  
  // Disabled styles
  const disabledStyles = disabled || isLoading 
    ? 'opacity-50' 
    : '';
  
  return (
    <TouchableOpacity
      className={classNames(
        baseStyles,
        sizeStyles[size],
        variants[variant],
        widthStyles,
        disabledStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <View className="flex-row items-center">
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' ? '#F59E0B' : '#000000'} 
            className="mr-2" 
          />
          <Text className={classNames(textVariants[variant], textSizes[size])}>
            Loading...
          </Text>
        </View>
      ) : (
        typeof children === 'string' ? (
          <Text className={classNames(textVariants[variant], textSizes[size])}>
            {children}
          </Text>
        ) : (
          children
        )
      )}
    </TouchableOpacity>
  );
}; 