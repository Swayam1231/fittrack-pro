import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext"; // ✅ added

type Props = {
  onEdit: () => void;
};

export default function TrainingPreferences({ onEdit }: Props) {
  const { colors } = useTheme(); // ✅ added

  return (
    <View
      style={{
        backgroundColor: colors.card, // ✅
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.textPrimary, // ✅
          }}
        >
          Training Preferences
        </Text>

        <Pressable onPress={onEdit}>
          <Ionicons
            name="pencil"
            size={18}
            color={colors.accent} // ✅
          />
        </Pressable>
      </View>

      {[
        { label: "Training Type", value: "Gym" },
        { label: "Frequency", value: "5 days / week" },
        { label: "Preferred Split", value: "Push / Pull / Legs" },
        { label: "Equipment", value: "Full gym access" },
        { label: "Cardio Preference", value: "Moderate" },
      ].map((item) => (
        <View
          key={item.label}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 8,
            borderBottomWidth: 0.5,
            borderColor: colors.border, // ✅
          }}
        >
          <Text style={{ color: colors.textSecondary }}>
            {item.label}
          </Text>
          <Text
            style={{
              fontWeight: "600",
              color: colors.textPrimary, // ✅
            }}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
