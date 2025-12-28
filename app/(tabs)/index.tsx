import { View, Text, ScrollView, Pressable, SafeAreaView } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { auth, db } from "../../src/firebase/firebase";
import { useTheme } from "../../src/context/ThemeContext"; // ✅ ADDED

import {
  collection,
  doc,
  query,
  where,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { Card } from "../../src/components/Card";

/* ------------------ HELPERS ------------------ */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------ COMPONENT ------------------ */

export default function Home() {
  const router = useRouter();
  const user = auth.currentUser;
  const { colors } = useTheme(); // ✅ ADDED

  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);

  const today = startOfToday();

  /* ================= REAL-TIME TARGETS ================= */

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setTargets(snap.data().targets);
      }
    });

    return unsub;
  }, [user]);

  /* ================= REAL-TIME MEALS (FIX) ================= */

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "meals"),
      where("createdAt", ">=", Timestamp.fromDate(today))
    );

    const unsub = onSnapshot(q, (snap) => {
      setMeals(snap.docs.map((d) => d.data()));
      setLoading(false);
    });

    return unsub;
  }, [user]);

  /* ================= REAL-TIME WORKOUTS (FIX) ================= */

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "workouts"),
      where("createdAt", ">=", Timestamp.fromDate(today))
    );

    const unsub = onSnapshot(q, (snap) => {
      setWorkouts(snap.docs.map((d) => d.data()));
    });

    return unsub;
  }, [user]);

  /* ================= CALCULATIONS ================= */

  const consumedCalories = useMemo(
    () => meals.reduce((s, m) => s + (m.calories || 0), 0),
    [meals]
  );

  const consumedProtein = useMemo(
    () => meals.reduce((s, m) => s + (m.protein || 0), 0),
    [meals]
  );

  const burnedCalories = useMemo(
    () => workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
    [workouts]
  );

  const targetCalories = targets?.calories || 0;
  const targetProtein = targets?.protein || 0;

  const remainingCalories = Math.max(targetCalories - consumedCalories, 0);

  const calorieProgress =
    targetCalories > 0
      ? Math.min((consumedCalories / targetCalories) * 100, 100)
      : 0;

  /* ================= UI (UNCHANGED) ================= */

  if (loading || !targets) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background, // ✅ COLOR ONLY
        }}
      >
        <Text style={{ color: colors.textPrimary }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- HEADER ---------- */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.textPrimary, // ✅
            }}
          >
            FitTrack
          </Text>

          <Pressable onPress={() => router.push("../profile")}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.border, // ✅
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ---------- DAILY SUMMARY ---------- */}
        <Card style={{ backgroundColor: colors.accent, marginBottom: 16 }}>
          <Text style={{ color: "#E0E7FF", fontSize: 14 }}>Daily Summary</Text>

          <Text style={{ color: "#E0E7FF", marginBottom: 12 }}>
            {formatDate(new Date())}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>
              {consumedCalories}/{targetCalories}
            </Text>

            <Text
              style={{
                color: "#fff",
                fontSize: 28,
                fontWeight: "700",
              }}
            >
              {remainingCalories}
            </Text>
          </View>

          <View
            style={{
              height: 8,
              backgroundColor: "#1E40AF",
              borderRadius: 6,
              marginTop: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${calorieProgress}%`,
                backgroundColor: "#93C5FD",
              }}
            />
          </View>
        </Card>

        {/* ---------- STATS GRID ---------- */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <StatCard title="Burned" value={burnedCalories} unit="cal" />
          <StatCard title="Workouts" value={workouts.length} unit="done" />
        </View>

        {/* ---------- MACRO GOALS ---------- */}
        <Card>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 12,
              color: colors.textPrimary, // ✅
            }}
          >
            Macro Goals
          </Text>

          <MacroRow
            label="Protein"
            value={consumedProtein}
            target={targetProtein}
            color="#DC2626"
          />
        </Card>

        {/* ---------- DAILY TIP ---------- */}
        <Card
          style={{
            backgroundColor: colors.card,
            borderLeftWidth: 4,
            borderLeftColor: colors.accent,
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              marginBottom: 4,
              color: colors.textPrimary,
            }}
          >
            💡 Daily Tip
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            You are doing great! Make sure to eat enough to fuel your workouts.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------ SMALL COMPONENTS ------------------ */

function StatCard({
  title,
  value,
  unit,
  sub,
  highlight,
}: {
  title: string;
  value: any;
  unit?: string;
  sub?: string;
  highlight?: boolean;
}) {
  const { colors } = useTheme(); // ✅ ADDED (NO STRUCTURE CHANGE)

  return (
    <Card style={{ width: "48%" }}>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{title}</Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color: highlight ? colors.danger : colors.textPrimary,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
        {sub ?? unit}
      </Text>
    </Card>
  );
}

function MacroRow({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const { colors } = useTheme(); // ✅ ADDED

  const percent = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ marginBottom: 4, color: colors.textPrimary }}>
        {label} {value}/{target}
      </Text>
      <View
        style={{
          height: 6,
          backgroundColor: colors.border, // ✅
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
