import { Stack } from 'expo-router';
import "./global.css"
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(public)/welcome" options={{ title: 'Welcome' }} />
      <Stack.Screen name="(public)/about" options={{ title: 'About' }} />

      <Stack.Screen name="(auth)/sign-in" options={{ title: 'Sign In' }} />
      <Stack.Screen name="(auth)/sign-up" options={{ title: 'Create Account' }} />
    </Stack>
  );
}
