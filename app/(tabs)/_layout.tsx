import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/ThemeContext"; // ✅ ADDED

export default function TabLayout() {
  const { colors } = useTheme(); // ✅ ADDED

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }} // ✅ COLOR ONLY
      edges={["top"]}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent, // ✅ COLOR ONLY
          tabBarInactiveTintColor: colors.textSecondary, // ✅ COLOR ONLY
          tabBarStyle: {
            height: 60,
            paddingTop: 6,
            paddingBottom: 6,
            backgroundColor: colors.card, // ✅ COLOR ONLY
            borderTopColor: colors.border, // ✅ COLOR ONLY
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="workout"
          options={{
            title: "Workout",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="nutrition"
          options={{
            title: "Nutrition",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="restaurant-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="analytics-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
