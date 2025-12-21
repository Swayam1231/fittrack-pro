import { View, Text, Pressable } from "react-native";

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
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color: "#6B7280",
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
            backgroundColor: "#2563EB",
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
