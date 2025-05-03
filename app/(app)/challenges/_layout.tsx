import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

export default function ChallengesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        fullScreenGestureEnabled: true,
      }}
    >
      {/* Profile screen - slides from left */}
      <Stack.Screen
        name="index"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  )
}