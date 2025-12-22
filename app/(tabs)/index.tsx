import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { auth, db } from "../../src/firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
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

  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);

  const today = startOfToday();

  /* ------------------ LOAD DATA ------------------ */

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setTargets(userDoc.data().targets);
      }

      const mealsSnap = await getDocs(
        query(
          collection(db, "users", user.uid, "meals"),
          where("createdAt", ">=", Timestamp.fromDate(today))
        )
      );

      const workoutsSnap = await getDocs(
        query(
          collection(db, "users", user.uid, "workouts"),
          where("createdAt", ">=", Timestamp.fromDate(today))
        )
      );

      setMeals(mealsSnap.docs.map((d) => d.data()));
      setWorkouts(workoutsSnap.docs.map((d) => d.data()));
      setLoading(false);
    };

    load();
  }, [user]);

  /* ------------------ CALCULATIONS ------------------ */

  const consumedCalories = useMemo(
    () => meals.reduce((s, m) => s + (m.calories || 0), 0),
    [meals]
  );

  const consumedProtein = useMemo(
    () => meals.reduce((s, m) => s + (m.protein || 0), 0),
    [meals]
  );

  // ✅ NEW: calories burned today from workouts
  const burnedCalories = useMemo(
    () =>
      workouts.reduce(
        (sum, w) => sum + (w.caloriesBurned || 0),
        0
      ),
    [workouts]
  );

  const targetCalories = targets?.calories || 0;
  const targetProtein = targets?.protein || 0;

  const remainingCalories = Math.max(
    targetCalories - consumedCalories,
    0
  );

  const calorieProgress =
    targetCalories > 0
      ? Math.min((consumedCalories / targetCalories) * 100, 100)
      : 0;

  /* ------------------ UI ------------------ */

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
          <Text style={{ fontSize: 24, fontWeight: "700" }}>
            FitTrack
          </Text>

          <Pressable onPress={() => router.push("../profile")}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ---------- DAILY SUMMARY ---------- */}
        <Card style={{ backgroundColor: "#2563EB", marginBottom: 16 }}>
          <Text style={{ color: "#E0E7FF", fontSize: 14 }}>
            Daily Summary
          </Text>

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
          <StatCard title="Consumed" value={consumedCalories} unit="cal" />
          <StatCard title="Burned" value={burnedCalories} unit="cal" />
          <StatCard title="Workouts" value={workouts.length} unit="done" />
          <StatCard
            title="Protein"
            value={`${consumedProtein}g`}
            sub={`of ${targetProtein}g`}
            highlight
          />
        </View>

        {/* ---------- MACROS ---------- */}
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
            Macro Goals
          </Text>

          <MacroRow
            label="Protein"
            value={consumedProtein}
            target={targetProtein}
            color="#DC2626"
          />

          <MacroRow
            label="Calories"
            value={consumedCalories}
            target={targetCalories}
            color="#2563EB"
          />
        </Card>

        {/* ---------- TIP ---------- */}
        <Card style={{ backgroundColor: "#EFF6FF" }}>
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>
            💡 Daily Tip
          </Text>
          <Text style={{ color: "#374151" }}>
            You're doing great! Make sure to eat enough to fuel your workouts.
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
  return (
    <Card style={{ width: "48%" }}>
      <Text style={{ fontSize: 12, color: "#6B7280" }}>{title}</Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color: highlight ? "#DC2626" : "#111827",
        }}
      >
        {value}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 12, color: "#6B7280" }}>{sub}</Text>
      ) : (
        <Text style={{ fontSize: 12, color: "#6B7280" }}>{unit}</Text>
      )}
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
  const percent =
    target > 0 ? Math.min((value / target) * 100, 100) : 0;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ marginBottom: 4 }}>
        {label} {value}/{target}
      </Text>
      <View
        style={{
          height: 6,
          backgroundColor: "#E5E7EB",
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
