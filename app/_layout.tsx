import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ThemeProvider } from "../src/context/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth } from "../src/firebase/firebase";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/(auth)/login");
      }
    });

    return unsubscribe;
  }, [router]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* AUTH */}
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />

          {/* MAIN APP */}
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
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
