import { View, Text, ScrollView } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { auth, db } from "../../src/firebase/firebase";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";
import { useTheme } from "../../src/context/ThemeContext"; // ✅ ADDED

/* ================= HELPERS ================= */

function startOfWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ================= COMPONENT ================= */

export default function Progress() {
  const uid = auth.currentUser?.uid;
  const { colors } = useTheme(); // ✅ ADDED

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [targets, setTargets] = useState<any>(null);

  useEffect(() => {
    if (!uid) return;

    const load = async () => {
      setLoading(true);

      const [mealSnap, workoutSnap, userSnap] = await Promise.all([
        getDocs(query(collection(db, "users", uid, "meals"))),
        getDocs(query(collection(db, "users", uid, "workouts"))),
        getDoc(doc(db, "users", uid)),
      ]);

      setMeals(mealSnap.docs.map((d) => d.data()));
      setWorkouts(workoutSnap.docs.map((d) => d.data()));
      setTargets(userSnap.data()?.targets ?? null);

      setLoading(false);
    };

    load();
  }, [uid]);

  /* ================= WEEKLY DATA ================= */

  const weekStart = startOfWeek();

  const caloriesByDay = useMemo(() => {
    const arr = Array(7).fill(0);
    meals.forEach((m) => {
      if (!m.createdAt) return;
      const d = startOfDay(m.createdAt.toDate());
      if (d < weekStart) return;
      arr[(d.getDay() + 6) % 7] += m.calories || 0;
    });
    return arr;
  }, [meals]);

  const workoutCaloriesByDay = useMemo(() => {
    const arr = Array(7).fill(0);
    workouts.forEach((w) => {
      if (!w.createdAt) return;
      const d = startOfDay(w.createdAt.toDate());
      if (d < weekStart) return;
      arr[(d.getDay() + 6) % 7] += w.caloriesBurned || 0;
    });
    return arr;
  }, [workouts]);

  const weeklyAvgCalories = useMemo(() => {
    const total = caloriesByDay.reduce((a, b) => a + b, 0);
    return Math.round(total / 7);
  }, [caloriesByDay]);

  /* ================= UI ================= */

  if (loading) return <Loading label="Loading progress..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 16,
            color: colors.textPrimary, // ✅
          }}
        >
          Progress
        </Text>

        {/* SUMMARY */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <Stat
            label="Weekly Avg Calories"
            value={`${weeklyAvgCalories} kcal`}
          />
        </View>

        {/* CALORIES GRAPH */}
        <ChartCard title="Calories Intake (This Week)">
          <BarChart data={caloriesByDay} unit="kcal" />
        </ChartCard>

        {/* WORKOUT GRAPH */}
        <ChartCard title="Workout Calories Burned (This Week)">
          <BarChart data={workoutCaloriesByDay} unit="kcal" accent />
        </ChartCard>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= UI COMPONENTS ================= */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors } = useTheme(); // ✅ ADDED

  return (
    <Card style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
        {label}
      </Text>
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme(); // ✅ ADDED

  return (
    <Card>
      <Text
        style={{
          fontWeight: "600",
          marginBottom: 12,
          color: colors.textPrimary, // ✅
        }}
      >
        {title}
      </Text>
      {children}
    </Card>
  );
}

/* ================= BAR CHART WITH Y AXIS ================= */

function BarChart({
  data,
  unit,
  accent,
}: {
  data: number[];
  unit: string;
  accent?: boolean;
}) {
  const { colors } = useTheme(); // ✅ ADDED
  const max = Math.max(...data, 1);
  const mid = Math.round(max / 2);

  return (
    <View style={{ flexDirection: "row", height: 140 }}>
      {/* Y AXIS */}
      <View
        style={{
          width: 36,
          justifyContent: "space-between",
          paddingVertical: 4,
        }}
      >
        <Text style={[yLabel, { color: colors.textSecondary }]}>{max}</Text>
        <Text style={[yLabel, { color: colors.textSecondary }]}>{mid}</Text>
        <Text style={[yLabel, { color: colors.textSecondary }]}>0</Text>
      </View>

      {/* BARS */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        {data.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                height: `${(v / max) * 100}%`,
                width: 14,
                backgroundColor: accent
                  ? "#16A34A" // 🔒 intentional green accent
                  : colors.accent, // ✅
                borderRadius: 6,
              }}
            />
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>
              {DAYS[i]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const yLabel = {
  fontSize: 10,
  color: "#6B7280",
};
