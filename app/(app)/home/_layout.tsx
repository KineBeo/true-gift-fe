import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router';

export default function HomeLayout() {
    return (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              borderTopLeftRadius: 60,
              borderTopRightRadius: 60,
            }
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
    
          <Stack.Screen
            name="friends"
            options={{
              headerShown: false,
              title: "Friends",
              presentation: "modal",            
            }}
          />
        </Stack>
      );
}

const styles = StyleSheet.create({})