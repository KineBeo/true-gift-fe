import React from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "../../lib/stores/auth-store";

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        fullScreenGestureEnabled: true,
      }}
    >
      {/* Profile screen - slides from left */}
      <Stack.Screen
        name="profile"
        options={{
          animation: "slide_from_left",
          animationDuration: 400,
        }}
      />

      {/* Message screen - slides from right */}
      <Stack.Screen
        name="message"
        options={{
          animation: "slide_from_right",
          animationDuration: 400,
        }}
      />

      <Stack.Screen
        name="challenges"
        options={{
          animation: "slide_from_bottom",
          animationDuration: 400,
        }}
      />
    </Stack>
  );
}
