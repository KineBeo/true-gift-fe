import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const ChallengesLayout = () => {
  return (
    <Stack>
      {/* Profile screen - slides from left */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="challenge-history"
        options={{
          headerShown: false,
          presentation: 'containedModal',
        }}
      />
    </Stack>
  )
}

export default ChallengesLayout