import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatWeight, UnitSystem } from "../../utils/unit";
import { useTheme } from "../../context/ThemeContext"; // ✅ ADDED

type Props = {
  currentWeight: number;
  targetWeight: number | null;
  goalStartWeight: number | null;
  unit: UnitSystem;
};

export default function GoalsMilestones({
  currentWeight,
  targetWeight,
  goalStartWeight,
  unit,
}: Props) {
  const router = useRouter();
  const { colors } = useTheme(); // ✅ ADDED

  /* ---------- SAFETY ---------- */
  if (!targetWeight || typeof goalStartWeight !== "number") {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card }, // ✅
        ]}
      >
        <Header
          onEdit={() => router.push("/edit-goal-weight")}
          color={colors.accent}
        />
        <Text style={[styles.muted, { color: colors.textSecondary }]}>
          Set a goal weight to start tracking milestones.
        </Text>
      </View>
    );
  }

  /* ---------- DIRECTION-AWARE PROGRESS ---------- */
  const startWeight = goalStartWeight;
  const isFatLoss = targetWeight < startWeight;

  let progressDelta = 0;

  if (isFatLoss) {
    progressDelta = Math.max(0, startWeight - currentWeight);
  } else {
    progressDelta = Math.max(0, currentWeight - startWeight);
  }

  const totalDelta = Math.abs(startWeight - targetWeight);

  const progressPercent =
    totalDelta > 0
      ? Math.min((progressDelta / totalDelta) * 100, 100)
      : 0;

  const milestones = [
    { percent: 25, label: "25%" },
    { percent: 50, label: "50%" },
    { percent: 75, label: "75%" },
    { percent: 100, label: "Goal" },
  ];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card }, // ✅
      ]}
    >
      <Header
        onEdit={() => router.push("/edit-goal-weight")}
        color={colors.accent}
      />

      {/* CURRENT GOAL */}
      <View
        style={[
          styles.goalBox,
          { backgroundColor: colors.background }, // ✅
        ]}
      >
        <Text style={[styles.bold, { color: colors.textPrimary }]}>
          Current Goal
        </Text>

        <Text style={[styles.goalText, { color: colors.textPrimary }]}>
          Reach {formatWeight(targetWeight, unit)}
        </Text>

        <Text
          style={[
            styles.smallMuted,
            { color: colors.textSecondary },
          ]}
        >
          Started at {formatWeight(startWeight, unit)} • Now{" "}
          {formatWeight(currentWeight, unit)}
        </Text>

        {/* PROGRESS BAR */}
        <View
          style={[
            styles.progressBg,
            { backgroundColor: colors.border }, // ✅
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: colors.accent, // ✅
              },
            ]}
          />
        </View>
      </View>

      {/* MILESTONES */}
      <Text style={[styles.bold, { color: colors.textPrimary }]}>
        Milestones
      </Text>

      <View style={styles.milestoneRow}>
        {milestones.map((m) => {
          const achieved = progressPercent >= m.percent;

          return (
            <View
              key={m.percent}
              style={[
                styles.milestoneCard,
                {
                  backgroundColor: achieved
                    ? colors.background
                    : colors.border, // ✅
                },
              ]}
            >
              <Ionicons
                name={
                  achieved
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={20}
                color={
                  achieved
                    ? colors.accent
                    : colors.textSecondary
                } // ✅
              />
              <Text
                style={[
                  styles.milestoneText,
                  { color: colors.textPrimary },
                ]}
              >
                {m.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- HEADER ---------- */
function Header({
  onEdit,
  color,
}: {
  onEdit: () => void;
  color: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Goals & Milestones</Text>
      <Pressable onPress={onEdit}>
        <Text style={[styles.edit, { color }]}>
          Edit
        </Text>
      </Pressable>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  edit: {
    fontWeight: "600",
  },
  muted: {
    color: "#6B7280",
  },
  bold: {
    fontWeight: "600",
    marginBottom: 8,
  },
  smallMuted: {
    marginTop: 4,
    fontSize: 12,
  },
  goalBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  goalText: {
    marginTop: 6,
  },
  progressBg: {
    height: 6,
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  milestoneCard: {
    width: "22%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  milestoneText: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: "500",
  },
});
