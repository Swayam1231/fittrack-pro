import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../src/context/ThemeContext";
import { auth } from "../src/firebase/firebase";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Not logged in, and not in auth group -> go to login
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Logged in, but still in auth group -> go to app
      router.replace("/(tabs)");
    }
  }, [user, isReady, segments, router]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="add-meal" />
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
