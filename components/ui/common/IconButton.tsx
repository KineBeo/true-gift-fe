// truegift-fe/components/ui/IconButton.tsx
import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface IconButtonProps extends TouchableOpacityProps {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  iconSize?: number;
  iconColor?: string;
  label?: string;
  labelStyles?: string;
  routePath?: string; 
  backgroundColor?: string;
  roundedSize?: "sm" | "md" | "lg" | "full";
  width?: number | string;
  height?: number | string;
}

const IconButton: React.FC<IconButtonProps> = ({
  iconName,
  iconSize = 22,
  iconColor = "white",
  label,
  labelStyles = "text-white ml-2 font-extrabold text-xl",
  routePath,
  backgroundColor = "bg-zinc-800/80",
  roundedSize = "full",
  width,
  height,
  className = "",
  ...props
}) => {
  const router = useRouter();
  
  const roundedStyles = {
    sm: "rounded-md",
    md: "rounded-xl",
    lg: "rounded-2xl",
    full: "rounded-full",
  };
  
  const handlePress = () => {
    if (routePath) {
      router.push(routePath as any);
    }
    
    if (props.onPress) {
      props.onPress(routePath as any);
    }
  };

  return (
    <TouchableOpacity
      className={`${backgroundColor} px-6 py-3 ${roundedStyles[roundedSize]} flex-row items-center ${className}`}
      style={{ width: width as any, height: height as any }}
      onPress={handlePress}
      {...props}
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
      {label && <Text className={labelStyles}>{label}</Text>}
    </TouchableOpacity>
  );
};

export default IconButton;