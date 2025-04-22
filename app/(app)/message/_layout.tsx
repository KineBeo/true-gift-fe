import React from "react";
import { Stack } from "expo-router";

export default function MessageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          borderTopLeftRadius: 60,
          borderTopRightRadius: 60,
        }, 
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Message",
          headerTintColor: "#333",
        }}
      />
      
      <Stack.Screen
        name="[id]"
        options={{
          title: "Chat",
          headerTintColor: "#333",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}