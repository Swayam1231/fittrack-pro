import {
  View,
  Text,
  ScrollView,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import { auth, db } from "../../src/firebase/firebase";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";

/* ---------- CONSTANTS ---------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------- HELPERS ---------- */

function toDayKey(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ---------- COMPONENT ---------- */

export default function Progress() {
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;

    const load = async () => {
      setLoading(true);

      const wSnap = await getDocs(
        query(collection(db, "users", uid, "workouts"))
      );

      const mSnap = await getDocs(
        query(collection(db, "users", uid, "meals"))
      );

      setWorkouts(wSnap.docs.map((d) => d.data()));
      setMeals(mSnap.docs.map((d) => d.data()));
      setLoading(false);
    };

    load();
  }, [uid]);

  /* ---------- WEEK DATA ---------- */

  const weekStart = startOfWeek();

  const workoutByDay = useMemo(() => {
    const arr = Array(7).fill(0);
    workouts.forEach((w) => {
      if (!w.createdAt) return;
      const d = w.createdAt.toDate();
      if (d < weekStart) return;
      arr[(d.getDay() + 6) % 7]++;
    });
    return arr;
  }, [workouts]);

  const caloriesByDay = useMemo(() => {
    const arr = Array(7).fill(0);
    meals.forEach((m) => {
      if (!m.createdAt) return;
      const d = m.createdAt.toDate();
      if (d < weekStart) return;
      arr[(d.getDay() + 6) % 7] += m.calories || 0;
    });
    return arr;
  }, [meals]);

  /* ---------- STREAK ---------- */

  const streak = useMemo(() => {
    const days = new Set<number>();
    workouts.forEach((w) => {
      if (w.createdAt)
        days.add(toDayKey(w.createdAt.toDate()));
    });

    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (days.has(cursor.getTime())) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }, [workouts]);

  const avgCalories = meals.length
    ? Math.round(
        caloriesByDay.reduce((a, b) => a + b, 0) / 7
      )
    : 0;

  if (loading) return <Loading label="Loading progress..." />;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 16,
          }}
        >
          Progress
        </Text>

        {/* STATS */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Stat label="Workouts" value={workouts.length} />
          <Stat label="Day Streak" value={streak} />
          <Stat label="Avg Calories" value={avgCalories} />
        </View>

        {/* WORKOUT GRAPH */}
        <ChartCard title="Weekly Workouts">
          <BarChart data={workoutByDay} />
        </ChartCard>

        {/* CALORIES GRAPH */}
        <ChartCard title="Calories Intake">
          <CaloriesChart data={caloriesByDay} />
        </ChartCard>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- UI ---------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>{value}</Text>
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

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  return (
    <View style={{ flexDirection: "row", height: 120 }}>
      {data.map((v, i) => (
        <View key={`bar-${i}`} style={{ flex: 1, alignItems: "center" }}>
          <View
            style={{
              height: `${(v / max) * 100}%`,
              width: 14,
              backgroundColor: "#2563EB",
              borderRadius: 6,
            }}
          />
          <Text style={{ fontSize: 10 }}>{DAYS[i]}</Text>
        </View>
      ))}
    </View>
  );
}

function CaloriesChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  return (
    <View style={{ flexDirection: "row", height: 120 }}>
      {data.map((v, i) => (
        <View key={`cal-${i}`} style={{ flex: 1, alignItems: "center" }}>
          <View
            style={{
              height: `${(v / max) * 100}%`,
              width: 14,
              backgroundColor: "#F97316",
              borderRadius: 6,
            }}
          />
          <Text style={{ fontSize: 10 }}>{DAYS[i]}</Text>
        </View>
      ))}
    </View>
  );
}
