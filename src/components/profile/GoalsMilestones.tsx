import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { formatWeight, UnitSystem } from "../../utils/unit";

type Props = {
  currentWeight: number;
  targetWeight: number | null;
  unit: UnitSystem;
};

type Metric = {
  weight: number;
  createdAt: any;
};

export default function GoalsMilestones({
  currentWeight,
  targetWeight,
  unit,
}: Props) {
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [metrics, setMetrics] = useState<Metric[]>([]);

  /* ---------- LIVE METRICS LISTENER ---------- */
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "metrics"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => d.data() as Metric);
      setMetrics(data);
    });

    return unsub;
  }, [uid]);

  /* ---------- SAFETY ---------- */
  if (!targetWeight) {
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
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700" }}>
            Goals & Milestones
          </Text>

          <Pressable onPress={() => router.push("/edit-goal-weight")}>
            <Text style={{ color: "#2563EB", fontWeight: "600" }}>
              Edit
            </Text>
          </Pressable>
        </View>

        <Text style={{ marginTop: 12, color: "#6B7280" }}>
          Set a goal weight to start tracking milestones.
        </Text>
      </View>
    );
  }

  if (metrics.length === 0) {
    return (
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700" }}>
          Goals & Milestones
        </Text>
        <Text style={{ marginTop: 12, color: "#6B7280" }}>
          Add weight entries to unlock milestones.
        </Text>
      </View>
    );
  }

  /* ---------- PROGRESS FROM HISTORY ---------- */
  const startWeight = metrics[0].weight;
  const latestWeight = metrics[metrics.length - 1].weight;

  const totalDelta = Math.abs(startWeight - targetWeight);
  const currentDelta = Math.abs(startWeight - latestWeight);

  const progressPercent =
    totalDelta > 0
      ? Math.min((currentDelta / totalDelta) * 100, 100)
      : 0;

  /* ---------- MILESTONES ---------- */
  const milestones = [
    { percent: 25, label: "25% Progress" },
    { percent: 50, label: "Halfway There" },
    { percent: 75, label: "Almost Done" },
    { percent: 100, label: "Goal Achieved" },
  ];

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700" }}>
          Goals & Milestones
        </Text>

        <Pressable onPress={() => router.push("/edit-goal-weight")}>
          <Text
            style={{
              color: "#2563EB",
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            Edit
          </Text>
        </Pressable>
      </View>

      {/* CURRENT GOAL */}
      <View
        style={{
          backgroundColor: "#F5F3FF",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: "600" }}>Current Goal</Text>
        <Text style={{ marginTop: 6, color: "#374151" }}>
          Reach {formatWeight(targetWeight, unit)}
        </Text>

        <Text style={{ marginTop: 4, color: "#6B7280", fontSize: 12 }}>
          Started at {formatWeight(startWeight, unit)} → now{" "}
          {formatWeight(latestWeight, unit)}
        </Text>

        {/* PROGRESS BAR */}
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
                width: `${progressPercent}%`,
                height: "100%",
                backgroundColor: "#4F46E5",
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      </View>

      {/* MILESTONES */}
      <Text style={{ fontWeight: "600", marginBottom: 8 }}>
        Milestones
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {milestones.map((m) => {
          const achieved = progressPercent >= m.percent;

          return (
            <View
              key={m.percent}
              style={{
                width: "22%",
                backgroundColor: achieved
                  ? "#ECFDF5"
                  : "#F3F4F6",
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
              }}
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
              <Text
                style={{
                  fontSize: 11,
                  textAlign: "center",
                  marginTop: 6,
                  fontWeight: "500",
                  color: achieved ? "#065F46" : "#6B7280",
                }}
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
