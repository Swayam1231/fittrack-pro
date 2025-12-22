import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onEdit: () => void;
};

export default function TrainingPreferences({ onEdit }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
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
        <Text style={{ fontSize: 16, fontWeight: "700" }}>
          Training Preferences
        </Text>

        <Pressable onPress={onEdit}>
          <Ionicons name="pencil" size={18} color="#2563EB" />
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
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ color: "#6B7280" }}>{item.label}</Text>
          <Text style={{ fontWeight: "600" }}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}
