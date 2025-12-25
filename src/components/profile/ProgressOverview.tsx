import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext"; // ✅ ADDED

/* ---------- TYPES ---------- */
type Range = 7 | 30 | 90;

type Props = {
  weightChange?: number;        // in lbs
  workoutConsistency?: number;  // %
  calorieAdherence?: number;    // %
};

export default function ProgressOverview({
  weightChange = -1.2,
  workoutConsistency = 87,
  calorieAdherence = 92,
}: Props) {
  const [range, setRange] = useState<Range>(7);
  const { colors } = useTheme(); // ✅ ADDED

  const Tab = ({ label, value }: { label: string; value: Range }) => (
    <Pressable
      onPress={() => setRange(value)}
      style={{
        flex: 1,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor:
          range === value ? colors.border : "transparent", // ✅
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontWeight: range === value ? "600" : "400",
          color: colors.textPrimary, // ✅
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const ProgressBar = ({ value, color }: { value: number; color: string }) => (
    <View
      style={{
        height: 6,
        backgroundColor: colors.border, // ✅
        borderRadius: 4,
        marginTop: 6,
      }}
    >
      <View
        style={{
          width: `${Math.min(value, 100)}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: 4,
        }}
      />
    </View>
  );

  return (
    <View
      style={{
        backgroundColor: colors.card, // ✅
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* ---------- HEADER ---------- */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 12,
          color: colors.textPrimary, // ✅
        }}
      >
        Progress Overview
      </Text>

      {/* ---------- RANGE SELECTOR ---------- */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.background, // ✅
          borderRadius: 24,
          padding: 4,
          marginBottom: 16,
        }}
      >
        <Tab label="7 Days" value={7} />
        <Tab label="30 Days" value={30} />
        <Tab label="90 Days" value={90} />
      </View>

      {/* ---------- WEIGHT CHANGE ---------- */}
      <View
        style={{
          backgroundColor: colors.background, // ✅
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary, // ✅
          }}
        >
          Weight Change
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Ionicons
            name="trending-down"
            size={18}
            color={colors.accent} // ✅
          />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.accent, // ✅
              marginLeft: 4,
            }}
          >
            {weightChange} lbs
          </Text>
        </View>
      </View>

      {/* ---------- WORKOUT CONSISTENCY ---------- */}
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary, // ✅
          }}
        >
          Workout Consistency
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colors.accent, // ✅
          }}
        >
          {workoutConsistency}%
        </Text>

        <ProgressBar
          value={workoutConsistency}
          color={colors.accent} // ✅
        />
      </View>

      {/* ---------- CALORIE ADHERENCE ---------- */}
      <View>
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary, // ✅
          }}
        >
          Calorie Adherence
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colors.accent, // ✅
          }}
        >
          {calorieAdherence}%
        </Text>

        <ProgressBar
          value={calorieAdherence}
          color={colors.accent} // ✅
        />
      </View>
    </View>
  );
}
