import { View, Text, ActivityIndicator } from "react-native";

export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <ActivityIndicator size="large" />

      {/* ✅ FORCE STRING RENDER */}
      <Text
        style={{
          marginTop: 12,
          color: "#6B7280",
        }}
      >
        {typeof label === "string" ? label : "Loading..."}
      </Text>
    </View>
  );
}
