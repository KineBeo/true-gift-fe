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
      {/* Home screen - default screen */}
      <Stack.Screen
        name="home/index"
        options={{
          animation: "slide_from_right", // When navigating TO home from other screens
        }}
      />

      {/* Profile screen - slides from left */}
      <Stack.Screen
        name="profile"
        options={{
          animation: "slide_from_left",
        }}
      />

      {/* Message screen - slides from right */}
      <Stack.Screen
        name="message"
        options={{
          animation: "slide_from_right",
        }}
      />

      {/* Photo history screen - slides from bottom as modal */}
      <Stack.Screen
        name="home/history"
        options={{
          headerShown: true,
          title: "Your Photos",
          headerTintColor: "#333",
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />

      {/* Photo detail screen - standard card presentation */}
      <Stack.Screen
        name="home/photo-detail"
        options={{
          headerShown: true,
          title: "Photo Detail",
          headerTintColor: "white",
          headerStyle: { backgroundColor: "black" },
          presentation: "card",
        }}
      />
    </Stack>
  );
}
