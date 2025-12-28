// src/components/profile/StatCard.tsx
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

type Props = {
  icon: any;
  label: string;
  value: string | number;
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
  const { colors } = useTheme();

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

      {/* LABEL */}
      <Text
        style={{
          fontSize: 12,
          marginTop: 8,
          color: colors.textSecondary, // ✅ FIX
        }}
      >
        {label}
      </Text>

      {/* VALUE */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginTop: 2,
          color: colors.textPrimary, // ✅ FIX
        }}
      >
        {String(value)}
      </Text>

      {/* SUBTITLE */}
      {subtitle && (
        <Text
          style={{
            fontSize: 12,
            marginTop: 2,
            color: colors.textSecondary, // ✅ FIX
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
