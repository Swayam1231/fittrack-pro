import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { startOfDay, format } from "date-fns";
import { FirestoreService } from "../../src/services/firestore.service";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";

/* ================= HELPERS ================= */

function startOfDayDate(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date) {
  const today = startOfDayDate(new Date()).getTime();
  const target = startOfDayDate(date).getTime();
  const diff = (target - today) / 86400000;

  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  return date.toDateString();
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;

/* ================= COMPONENT ================= */

export default function Nutrition() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;
  const { colors } = useTheme();

  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingDate, setChangingDate] = useState(false);

  const [targets, setTargets] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  /* ---------- LOAD PROFILE TARGETS ---------- */
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      return FirestoreService.subscribeToProfile(uid, (data) => {
        if (!data) return;
        setTargets({
          calories: data.targets.calories ?? 0,
          protein: data.targets.protein ?? 0,
          carbs: data.targets.carbs ?? 0,
          fats: data.targets.fats ?? 0,
        });
      });
    }, [uid])
  );

  /* ---------- LOAD MEALS ---------- */
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      return FirestoreService.subscribeToMealsByDate(uid, date, (data) => {
        setMeals(data);
        setLoading(false);
      });
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
        typeof m.mealType === "string" ? m.mealType.toLowerCase() : "breakfast";

      if (key.includes("breakfast")) map.Breakfast.push(m);
      else if (key.includes("lunch")) map.Lunch.push(m);
      else if (key.includes("dinner")) map.Dinner.push(m);
      else map.Snacks.push(m);
    });

    return map;
  }, [meals]);

  const deleteMeal = async (id: string) => {
    if (!uid) return;
    await FirestoreService.deleteMeal(uid, id);
  };

  /* ---------- SAVE AS FAVORITE ---------- */
  const saveAsFavorite = async (m: any) => {
    if (!uid) return;
    await FirestoreService.addFavoriteMeal(uid, {
      foodName: m.foodName,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fats: m.fats,
      grams: m.grams,
    });
    alert("Saved to Favorite Meals!");
  };

  if (loading) return <Loading label="Loading nutrition..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Nutrition
        </Text>

        <View style={[styles.dateBox, { borderColor: colors.border }]}>
          <Pressable onPress={() => changeDate(-1)} hitSlop={12}>
            <Text style={[styles.arrow, { color: colors.textPrimary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>
            {format(date, "EEEE, MMM d")}
          </Text>
          <Pressable onPress={() => changeDate(1)} hitSlop={12}>
            <Text style={[styles.arrow, { color: colors.textPrimary }]}>›</Text>
          </Pressable>
        </View>

        {/* MACROS */}
        <View style={styles.macroGrid}>
          <Macro
            title="Calories"
            value={totals.calories}
            goal={targets.calories}
          />
          <Macro title="Protein" value={totals.protein} goal={targets.protein} />
          <Macro title="Carbs" value={totals.carbs} goal={targets.carbs} />
          <Macro title="Fats" value={totals.fats} goal={targets.fats} />
        </View>

        {/* MEALS */}
        <View style={{ marginTop: 20 }}>
          {MEAL_TYPES.map((type) => (
            <View key={type} style={{ marginBottom: 16 }}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textPrimary }]}
                >
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
                  <Text style={[styles.add, { color: colors.accent }]}>＋</Text>
                </Pressable>
              </View>

              {mealsByType[type].map((m) => (
                <Card
                  key={m.id}
                  style={{ marginBottom: 8, backgroundColor: colors.card }}
                >
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontWeight: "600", color: colors.textPrimary }}
                      >
                        {m.foodName}
                      </Text>

                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {m.grams} g • {m.calories} kcal
                      </Text>

                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        P {m.protein}g | C {m.carbs}g | F {m.fats}g
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <Pressable onPress={() => saveAsFavorite(m)}>
                        <Ionicons name="star-outline" size={18} color={colors.warning} />
                      </Pressable>
                      <Pressable onPress={() => deleteMeal(m.id)}>
                        <Text style={[styles.delete, { color: colors.danger }]}>
                          🗑️
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  const { colors } = useTheme();

  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <Card style={styles.macroCard}>
      <Text style={[styles.macroTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
        {value}/{goal}
      </Text>
      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.barFill,
            { width: `${pct}%`, backgroundColor: colors.accent },
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
  macroTitle: { fontSize: 12 },
  macroValue: { fontWeight: "700", marginBottom: 6 },

  barBg: {
    height: 6,
    borderRadius: 4,
  },
  barFill: {
    height: "100%",
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
  delete: {},
  add: { fontSize: 18 },
});
