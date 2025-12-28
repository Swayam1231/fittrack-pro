import { View, Text, ScrollView } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../src/firebase/firebase";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";
import { useTheme } from "../../src/context/ThemeContext";
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
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [targets, setTargets] = useState<any>(null);



useEffect(() => {
  if (!uid) return;

  setLoading(true);

  const mealsRef = collection(db, "users", uid, "meals");
  const workoutsRef = collection(db, "users", uid, "workouts");
  const userRef = doc(db, "users", uid);

  const unsubMeals = onSnapshot(mealsRef, (snap) => {
    setMeals(snap.docs.map((d) => d.data()));
  });

  const unsubWorkouts = onSnapshot(workoutsRef, (snap) => {
    setWorkouts(snap.docs.map((d) => d.data()));
  });

  const unsubUser = onSnapshot(userRef, (snap) => {
    setTargets(snap.data()?.targets ?? null);
    setLoading(false);
  });

  return () => {
    unsubMeals();
    unsubWorkouts();
    unsubUser();
  };
}, [uid]);


  /* ================= WEEKLY DATA ================= */

  const weekStart = useMemo(() => startOfWeek(), []);


  const caloriesByDay = useMemo(() => {
  const arr = Array(7).fill(0);
  meals.forEach((m) => {
    if (!m.createdAt) return;
    const d = startOfDay(m.createdAt.toDate());
    if (d < weekStart) return;
    arr[(d.getDay() + 6) % 7] += m.calories || 0;
  });
  return arr;
}, [meals, weekStart]);


  const workoutCaloriesByDay = useMemo(() => {
  const arr = Array(7).fill(0);
  workouts.forEach((w) => {
    if (!w.createdAt) return;
    const d = startOfDay(w.createdAt.toDate());
    if (d < weekStart) return;
    arr[(d.getDay() + 6) % 7] += w.caloriesBurned || 0;
  });
  return arr;
}, [workouts, weekStart]);


 const totalWeeklyCalories = useMemo(() => {
  return caloriesByDay.reduce((a, b) => a + b, 0);
}, [caloriesByDay]);

const weeklyGoalCalories = useMemo(() => {
  return targets?.calories
    ? targets.calories * 7
    : 0;
}, [targets]);


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
            color: colors.textPrimary,
          }}
        >
          Progress
        </Text>

        <View style={{ marginBottom: 16 }}>
         <Stat
  label="Weekly Calories vs Goal"
  value={`${totalWeeklyCalories} / ${weeklyGoalCalories} kcal`}
/>

        </View>

        <ChartCard title="Calories Intake (This Week)">
          <BarChart data={caloriesByDay} accentColor={colors.accent} />
        </ChartCard>

        <ChartCard title="Workout Calories Burned (This Week)">
          <BarChart data={workoutCaloriesByDay} accentColor="#16A34A" />
        </ChartCard>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= UI COMPONENTS ================= */

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <Card style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textPrimary }}>
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
  const { colors } = useTheme();

  return (
    <Card style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontWeight: "600",
          marginBottom: 12,
          color: colors.textPrimary,
        }}
      >
        {title}
      </Text>
      {children}
    </Card>
  );
}

/* ================= IMPROVED BAR CHART ================= */
function BarChart({
  data,
  accentColor,
}: {
  data: number[];
  accentColor: string;
}) {
  const { colors } = useTheme();

  const max = Math.max(...data, 1);
  const chartHeight = 160;
  const topPadding = 16;     // 🔥 NEW
  const bottomPadding = 24;  // for day labels
  const usableHeight = chartHeight - topPadding - bottomPadding;
  const minBarHeight = 6;

  return (
    <View style={{ flexDirection: "row", height: chartHeight }}>
      {/* Y AXIS */}
      <View
        style={{
          width: 36,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 10, color: colors.textSecondary }}>{max}</Text>
        <Text style={{ fontSize: 10, color: colors.textSecondary }}>
          {Math.round(max / 2)}
        </Text>
        <Text style={{ fontSize: 10, color: colors.textSecondary }}>0</Text>
      </View>

      {/* GRAPH */}
      <View style={{ flex: 1 }}>
        {/* GRID LINES */}
        {[1, 0.5].map((g) => (
          <View
            key={g}
            style={{
              position: "absolute",
              top: topPadding + usableHeight * (1 - g),
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: colors.border,
            }}
          />
        ))}

        {/* BARS */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: usableHeight,
            marginTop: topPadding,
          }}
        >
          {data.map((v, i) => {
            const h = Math.max(
              (v / max) * usableHeight,
              minBarHeight
            );

            return (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    height: h,
                    width: 18,
                    backgroundColor: accentColor,
                    borderRadius: 6,
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    marginTop: 6,
                    color: colors.textSecondary,
                  }}
                >
                  {DAYS[i]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
