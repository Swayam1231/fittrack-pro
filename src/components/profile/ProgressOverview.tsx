import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useProgressMetrics } from "../../hooks/useProgressMetrics";

type Range = 7 | 30 | 90;

export default function ProgressOverview() {
  const { colors } = useTheme();
  const [range, setRange] = useState<Range>(7);

  const {
    weightChange,
    workoutConsistency,
    calorieAdherence,
    loading,
  } = useProgressMetrics(range);

  const RangeButton = ({ value }: { value: Range }) => (
    <Pressable
      onPress={() => setRange(value)}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: range === value ? colors.card : "transparent",
        alignItems: "center",
      }}
    >
      <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
        {value} Days
      </Text>
    </Pressable>
  );

  if (loading) return null;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 12,
          color: colors.textPrimary,
        }}
      >
        Progress Overview
      </Text>

      {/* RANGE SELECTOR */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.background,
          borderRadius: 24,
          padding: 4,
          marginBottom: 16,
        }}
      >
        <RangeButton value={7} />
        <RangeButton value={30} />
        <RangeButton value={90} />
      </View>

      {/* METRICS */}
      <Metric
        label="Weight Change"
        value={`${weightChange >= 0 ? "+" : ""}${weightChange.toFixed(1)} kg`}
      />
      <Metric
        label="Workout Consistency"
        value={`${workoutConsistency}%`}
      />
      <Metric
        label="Calorie Adherence"
        value={`${calorieAdherence}%`}
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: colors.accent,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
