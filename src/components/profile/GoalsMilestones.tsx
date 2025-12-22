import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function GoalsMilestones() {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
        Goals & Milestones
      </Text>

      {/* Current Goal */}
      <View
        style={{
          backgroundColor: "#F5F3FF",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="radio-button-on" size={18} color="#4F46E5" />
          <Text style={{ marginLeft: 8, fontWeight: "600" }}>
            Current Goal
          </Text>
        </View>

        <Text style={{ marginTop: 6, color: "#374151" }}>
          Reach 155 lbs by March 2025
        </Text>

        {/* Progress */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            Progress
          </Text>

          <View
            style={{
              height: 6,
              backgroundColor: "#E5E7EB",
              borderRadius: 4,
              marginTop: 6,
            }}
          >
            <View
              style={{
                width: "0%",
                height: "100%",
                backgroundColor: "#4F46E5",
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      </View>

      {/* Milestones */}
      <Text style={{ fontWeight: "600", marginBottom: 8 }}>
        Milestones Achieved
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {[
          { icon: "ribbon-outline", label: "First 5 lbs", bg: "#FEF3C7", color: "#D97706" },
          { icon: "flame-outline", label: "7-day streak", bg: "#ECFDF5", color: "#16A34A" },
          { icon: "barbell-outline", label: "30 workouts", bg: "#EFF6FF", color: "#2563EB" },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              width: "30%",
              backgroundColor: item.bg,
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Ionicons name={item.icon as any} size={20} color={item.color} />
            <Text
              style={{
                fontSize: 12,
                textAlign: "center",
                marginTop: 6,
                fontWeight: "500",
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
