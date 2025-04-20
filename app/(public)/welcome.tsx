import { View, Text, Button, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function Welcome() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Welcome to Locket Clone
      </Text>
      {/* <Link href="/(auth)/sign-in" asChild>
        <Button title="Sign In" />
      </Link>
      <Link href="/(auth)/sign-up" asChild>
        <Button title="Create Account" />
      </Link>
      <Link href="/about" className="text-black">
        Go to About screen
      </Link> */}
      <Link href="/(app)/home" className="text-black">
        Go to Home
      </Link>
    </View>
  );
}
