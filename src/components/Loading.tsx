import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";

export function Loading({ label = "Loading..." }: { label?: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.accent} />

      <Text
        style={{
          marginTop: 12,
          color: colors.textSecondary,
        }}
      >
        {typeof label === "string" ? label : "Loading..."}
      </Text>
    </View>
  );
}
