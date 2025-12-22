// src/components/profile/StatCard.tsx
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  icon: any;
  label: string;
  value: string;
  subtitle?: string;
  bg: string;
  color: string;
};

export default function StatCard({
  icon,
  label,
  value,
  subtitle,
  bg,
  color,
}: Props) {
  return (
    <View
      style={{
        flexBasis: "48%",
        backgroundColor: bg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Ionicons name={icon} size={20} color={color} />

      <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
        {label}
      </Text>

      <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 2 }}>
        {value}
      </Text>

      {subtitle && (
        <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
