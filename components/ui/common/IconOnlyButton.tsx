// truegift-fe/components/ui/common/IconOnlyButton.tsx
import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

interface IconOnlyButtonProps extends TouchableOpacityProps {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  iconSize?: number;
  iconColor?: string;
  routePath?: string;
  backgroundColor?: string;
}

const IconOnlyButton: React.FC<IconOnlyButtonProps> = ({
  iconName,
  iconSize = 22,
  iconColor = "white",
  routePath,
  backgroundColor = "bg-zinc-800/80",
  className = "",
  ...props
}) => {
  const router = useRouter();
  
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
      className={`${backgroundColor} p-4 rounded-full ${className}`}
      onPress={handlePress}
      {...props}
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

export default IconOnlyButton;