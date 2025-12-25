import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useState, useMemo, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { auth, db } from "../../src/firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";
import { useTheme } from "../../src/context/ThemeContext"; // ✅ ADDED

/* ================= HELPERS ================= */

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDate(date: Date) {
  const today = startOfDay(new Date()).getTime();
  const target = startOfDay(date).getTime();
  const diff = (target - today) / 86400000;

  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  return date.toDateString();
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;

/* ================= COMPONENT ================= */

export default function Nutrition() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;
  const { colors } = useTheme(); // ✅ ADDED

  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingDate, setChangingDate] = useState(false);

  /* 🔴 PROFILE TARGETS (SOURCE OF TRUTH) */
  const [targets, setTargets] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  /* ---------- LOAD PROFILE TARGETS ---------- */
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        if (!uid) return;

        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) return;

        const data = snap.data();
        const t = data.targets;

        if (!t) return;

        setTargets({
          calories: t.calories ?? 0,
          protein: t.protein ?? 0,
          carbs: t.carbs ?? 0,
          fats: t.fats ?? 0,
        });
      };

      loadProfile();
    }, [uid])
  );

  /* ---------- LOAD MEALS ---------- */
  useFocusEffect(
    useCallback(() => {
      const loadMeals = async () => {
        if (!uid) return;

        setLoading(true);

        const snap = await getDocs(
          query(
            collection(db, "users", uid, "meals"),
            where("createdAt", ">=", Timestamp.fromDate(startOfDay(date))),
            where("createdAt", "<=", Timestamp.fromDate(endOfDay(date)))
          )
        );

        setMeals(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );

        setLoading(false);
      };

      loadMeals();
    }, [uid, date])
  );

  /* ---------- DATE CHANGE ---------- */
  const changeDate = (dir: -1 | 1) => {
    if (changingDate) return;
    setChangingDate(true);

    setDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir);
      return d;
    });

    setTimeout(() => setChangingDate(false), 200);
  };

  /* ---------- TOTALS ---------- */
  const totals = useMemo(() => {
    return meals.reduce(
      (a, m) => {
        a.calories += Number(m.calories || 0);
        a.protein += Number(m.protein || 0);
        a.carbs += Number(m.carbs || 0);
        a.fats += Number(m.fats || 0);
        return a;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [meals]);

  /* ---------- GROUP MEALS ---------- */
  const mealsByType = useMemo(() => {
    const map: Record<string, any[]> = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: [],
    };

    meals.forEach((m) => {
      const key =
        typeof m.mealType === "string"
          ? m.mealType.toLowerCase()
          : "breakfast";

      if (key.includes("breakfast")) map.Breakfast.push(m);
      else if (key.includes("lunch")) map.Lunch.push(m);
      else if (key.includes("dinner")) map.Dinner.push(m);
      else map.Snacks.push(m);
    });

    return map;
  }, [meals]);

  const deleteMeal = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "meals", id));
    setMeals((p) => p.filter((m) => m.id !== id));
  };

  if (loading)
    return <Loading label="Loading nutrition..." />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]} // ✅
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Nutrition
      </Text>

      {/* DATE */}
      <View
        style={[
          styles.dateBox,
          { borderColor: colors.border }, // ✅
        ]}
      >
        <Pressable onPress={() => changeDate(-1)} hitSlop={12}>
          <Text style={[styles.arrow, { color: colors.textPrimary }]}>
            ‹
          </Text>
        </Pressable>
        <Text style={[styles.dateText, { color: colors.textPrimary }]}>
          {formatDate(date)}
        </Text>
        <Pressable onPress={() => changeDate(1)} hitSlop={12}>
          <Text style={[styles.arrow, { color: colors.textPrimary }]}>
            ›
          </Text>
        </Pressable>
      </View>

      {/* MACROS */}
      <View style={styles.macroGrid}>
        <Macro title="Calories" value={totals.calories} goal={targets.calories} />
        <Macro title="Protein" value={totals.protein} goal={targets.protein} />
        <Macro title="Carbs" value={totals.carbs} goal={targets.carbs} />
        <Macro title="Fats" value={totals.fats} goal={targets.fats} />
      </View>

      {/* MEALS */}
      <View style={{ marginTop: 20 }}>
        {MEAL_TYPES.map((type) => (
          <View key={type} style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {type}
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/add-meal",
                    params: {
                      mealType: type,
                      date: startOfDay(date).toISOString(),
                    },
                  })
                }
              >
                <Text style={[styles.add, { color: colors.accent }]}>
                  ＋
                </Text>
              </Pressable>
            </View>

            {mealsByType[type].map((m) => (
              <Card key={m.id} style={{ marginBottom: 8 }}>
                <View style={styles.row}>
                  <Text style={{ fontWeight: "600", color: colors.textPrimary }}>
                    {m.name}
                  </Text>
                  <Pressable onPress={() => deleteMeal(m.id)}>
                    <Text style={[styles.delete, { color: colors.danger }]}>
                      🗑️
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ================= SUB ================= */

function Macro({
  title,
  value,
  goal,
}: {
  title: string;
  value: number;
  goal: number;
}) {
  const { colors } = useTheme(); // ✅ ADDED

  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <Card style={styles.macroCard}>
      <Text style={[styles.macroTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
        {value}/{goal}
      </Text>
      <View
        style={[
          styles.barBg,
          { backgroundColor: colors.border }, // ✅
        ]}
      >
        <View
          style={[
            styles.barFill,
            { width: `${pct}%`, backgroundColor: colors.accent }, // ✅
          ]}
        />
      </View>
    </Card>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },

  dateBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginVertical: 16,
  },
  arrow: { fontSize: 28, fontWeight: "600" },
  dateText: { fontWeight: "600" },

  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  macroCard: { width: "48%" },
  macroTitle: { fontSize: 12, color: "#6B7280" },
  macroValue: { fontWeight: "700", marginBottom: 6 },

  barBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  barFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sectionTitle: { fontWeight: "700" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  delete: { color: "#DC2626" },
  add: { fontSize: 18, color: "#2563EB" },
});
