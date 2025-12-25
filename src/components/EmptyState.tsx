import { View, Text, Pressable } from "react-native";
import { useTheme } from "../context/ThemeContext"; // ✅ added

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  const { colors } = useTheme(); // ✅ added

  return (
    <View
      style={{
        padding: 24,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 6,
          color: colors.textPrimary, // ✅
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color: colors.textSecondary, // ✅
          textAlign: "center",
        }}
      >
        {description}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={{
            marginTop: 12,
            backgroundColor: colors.accent, // ✅
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
