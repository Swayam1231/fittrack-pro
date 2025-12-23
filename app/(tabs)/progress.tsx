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

  // /* ================= STREAK ================= */

  // const streak = useMemo(() => {
  //   if (!targets?.calories) return 0;

  //   const dailyCalories = new Map<string, number>();

  //   meals.forEach((m) => {
  //     if (!m.createdAt) return;
  //     const key = startOfDay(m.createdAt.toDate()).toISOString();
  //     dailyCalories.set(
  //       key,
  //       (dailyCalories.get(key) || 0) + (m.calories || 0)
  //     );
  //   });

  //   let count = 0;
  //   let cursor = startOfDay(new Date());

  //   while (true) {
  //     const key = cursor.toISOString();
  //     const consumed = dailyCalories.get(key);
  //     if (!consumed) break;

  //     const withinRange =
  //       consumed >= targets.calories * 0.9 &&
  //       consumed <= targets.calories * 1.1;

  //     if (!withinRange) break;

  //     count++;
  //     cursor.setDate(cursor.getDate() - 1);
  //   }

  //   return count;
  // }, [meals, targets]);

  // if (loading) {
  //   return <Loading label="Loading progress…" />;
  // }

  /* ================= UI ================= */

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
          Progress
        </Text>

        {/* SUMMARY */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {/* <Stat label="Calorie Streak" value={`${streak} days`} /> */}
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
  return (
    <Card style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>{value}</Text>
      <Text style={{ fontSize: 12, color: "#6B7280" }}>{label}</Text>
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
  return (
    <Card>
      <Text style={{ fontWeight: "600", marginBottom: 12 }}>
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
        <Text style={yLabel}>{max}</Text>
        <Text style={yLabel}>{mid}</Text>
        <Text style={yLabel}>0</Text>
      </View>

      {/* BARS */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        {data.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                height: `${(v / max) * 100}%`,
                width: 14,
                backgroundColor: accent ? "#16A34A" : "#2563EB",
                borderRadius: 6,
              }}
            />
            <Text style={{ fontSize: 10 }}>{DAYS[i]}</Text>
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
