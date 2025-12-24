import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatWeight, UnitSystem } from "../../utils/unit";

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

  /* ---------- SAFETY ---------- */
  if (!targetWeight || typeof goalStartWeight !== "number") {
    return (
      <View style={styles.card}>
        <Header onEdit={() => router.push("/edit-goal-weight")} />
        <Text style={styles.muted}>
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
    // Fat loss → progress only if weight goes down
    progressDelta = Math.max(0, startWeight - currentWeight);
  } else {
    // Muscle gain → progress only if weight goes up
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
    <View style={styles.card}>
      <Header onEdit={() => router.push("/edit-goal-weight")} />

      {/* CURRENT GOAL */}
      <View style={styles.goalBox}>
        <Text style={styles.bold}>Current Goal</Text>

        <Text style={styles.goalText}>
          Reach {formatWeight(targetWeight, unit)}
        </Text>

        <Text style={styles.smallMuted}>
          Started at {formatWeight(startWeight, unit)} • Now{" "}
          {formatWeight(currentWeight, unit)}
        </Text>

        {/* PROGRESS BAR */}
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>
      </View>

      {/* MILESTONES */}
      <Text style={styles.bold}>Milestones</Text>

      <View style={styles.milestoneRow}>
        {milestones.map((m) => {
          const achieved = progressPercent >= m.percent;

          return (
            <View
              key={m.percent}
              style={[
                styles.milestoneCard,
                achieved && styles.milestoneActive,
              ]}
            >
              <Ionicons
                name={
                  achieved
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={20}
                color={achieved ? "#16A34A" : "#9CA3AF"}
              />
              <Text style={styles.milestoneText}>{m.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- HEADER ---------- */
function Header({ onEdit }: { onEdit: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Goals & Milestones</Text>
      <Pressable onPress={onEdit}>
        <Text style={styles.edit}>Edit</Text>
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
    color: "#2563EB",
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
    color: "#6B7280",
    fontSize: 12,
  },
  goalBox: {
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  goalText: {
    marginTop: 6,
    color: "#374151",
  },
  progressBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 4,
  },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  milestoneCard: {
    width: "22%",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  milestoneActive: {
    backgroundColor: "#ECFDF5",
  },
  milestoneText: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: "500",
  },
});
