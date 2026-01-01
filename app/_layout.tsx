import { Stack } from "expo-router";
import { ThemeProvider } from "../src/context/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth */}
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />

          {/* App */}
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="add-meal" />
          <Stack.Screen name="add-metric" />
          <Stack.Screen name="add-workout" />
          <Stack.Screen name="workout/[id]" />
          <Stack.Screen name="edit-workout/[id]" />
          <Stack.Screen name="exercise-presets" />

          {/* Scanner */}
          <Stack.Screen name="scan-barcode" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
