import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth */}
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />

      {/* Main App */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="add-meal" />
      <Stack.Screen name="meal/[id]" />
      <Stack.Screen name="add-metric" />
      <Stack.Screen name="add-workout" />
      <Stack.Screen name="workout/[id]" />
      <Stack.Screen name="edit-workout/[id]" />
      <Stack.Screen name="exercise-presets" />

    </Stack>
  );
}
