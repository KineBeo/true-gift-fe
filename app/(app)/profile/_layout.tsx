import React from "react";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

export default function ProfileLayout() {
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
      
      {/* Settings và Friends screens - cả hai đều trượt từ dưới lên */}
      <Stack.Screen
        name="setting"
        options={{
          headerShown: false,
          title: "Settings",
          presentation: "modal",
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

const styles = StyleSheet.create({
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
});