import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../src/firebase/firebase";
import {
  addDoc,
  collection,
  Timestamp,
  setDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useTheme } from "../src/context/ThemeContext";
import {
  FoodLibraryItem,
  loadFoodLibrary,
  searchFoods,
} from "../src/data/foodLibrary";

/* ================= TYPES ================= */

type RouteParams = {
  mealType?: string;
  foodId?: string;
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  grow: { flex: 1 },

  star: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  primaryButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  primaryText: { color: "#fff", fontWeight: "600" },

  link: { marginBottom: 12 },
});

/* ================= COMPONENT ================= */

export default function AddMeal() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const { colors } = useTheme();
  const uid = auth.currentUser?.uid;

  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<FoodLibraryItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [selected, setSelected] = useState<FoodLibraryItem | null>(null);
  const [grams, setGrams] = useState("100");

  /* ---------- LOAD FOOD LIBRARY ---------- */
  useEffect(() => {
    loadFoodLibrary();
  }, []);

  /* ---------- LOAD FAVORITES ---------- */
  useEffect(() => {
    if (!uid) return;

    const loadFavorites = async () => {
      const snap = await getDocs(
        query(
          collection(db, "users", uid, "foodStats"),
          where("favorite", "==", true)
        )
      );

      const set = new Set<string>();
      snap.forEach((d) => set.add(d.id));
      setFavorites(set);
    };

    loadFavorites();
  }, [uid]);

  /* ---------- SEARCH ---------- */
  const onSearch = (text: string) => {
    setQueryText(text);
    setResults(searchFoods(text));
  };

  /* ---------- LOAD LAST USED GRAMS ---------- */
  const loadFoodStats = async (foodId: string) => {
    if (!uid) return;
    const snap = await getDoc(doc(db, "users", uid, "foodStats", foodId));
    if (snap.exists() && snap.data().lastUsedGrams) {
      setGrams(String(snap.data().lastUsedGrams));
    }
  };

  /* ---------- TOGGLE FAVORITE (PERSIST IMMEDIATELY) ---------- */
  const toggleFavorite = async (foodId: string) => {
    if (!uid) return;

    const isFav = favorites.has(foodId);

    await setDoc(
      doc(db, "users", uid, "foodStats", foodId),
      {
        favorite: !isFav, // ⭐ persist immediately
      },
      { merge: true }
    );

    setFavorites((prev) => {
      const n = new Set(prev);
      isFav ? n.delete(foodId) : n.add(foodId);
      return n;
    });
  };

  /* ---------- CALCULATIONS ---------- */
  const g = Number(grams) || 0;

  const calories = selected
    ? Math.round((selected.caloriesPer100g * g) / 100)
    : 0;
  const protein = selected
    ? Math.round((selected.proteinPer100g * g) / 100)
    : 0;
  const carbs = selected ? Math.round((selected.carbsPer100g * g) / 100) : 0;
  const fats = selected ? Math.round((selected.fatsPer100g * g) / 100) : 0;

  /* ---------- SAVE MEAL (DO NOT TOUCH FAVORITE) ---------- */
  const saveMeal = async () => {
    if (!uid || !selected || g <= 0) return;

    await addDoc(collection(db, "users", uid, "meals"), {
      foodId: selected.id,
      foodName: selected.name,
      grams: g,
      calories,
      protein,
      carbs,
      fats,
      mealType: params.mealType || "Breakfast",
      createdAt: Timestamp.now(),
    });

    await setDoc(
      doc(db, "users", uid, "foodStats", selected.id),
      {
        lastUsedGrams: g,
        lastUsedAt: Timestamp.now(),
        // ❌ DO NOT overwrite favorite
      },
      { merge: true }
    );

    router.back();
  };

  /* ---------- SORT RESULTS ---------- */
  const orderedResults = [
    ...results.filter((f) => favorites.has(f.id)),
    ...results.filter((f) => !favorites.has(f.id)),
  ];

  /* ================= UI ================= */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Add {params.mealType || "Meal"}
        </Text>

        {/* ⭐ FAVORITES SCREEN */}
        {!selected && (
          <TouchableOpacity
            onPress={() => router.push("/favorite-foods")}
            style={styles.link}
          >
            <Text style={{ color: colors.accent, fontWeight: "600" }}>
              ⭐ View Favorites
            </Text>
          </TouchableOpacity>
        )}

        {/* ➕ ADD CUSTOM FOOD (RESTORED) */}
        {!selected && (
          <TouchableOpacity
            onPress={() => router.push("/add-custom-food")}
            style={styles.link}
          >
            <Text style={{ color: colors.accent }}>
              + Add Custom Food
            </Text>
          </TouchableOpacity>
        )}

        {!selected && (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Search food"
              placeholderTextColor={colors.textSecondary}
              value={queryText}
              onChangeText={onSearch}
            />

            {orderedResults.map((f) => (
              <View
                key={f.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.grow}
                    onPress={async () => {
                      setSelected(f);
                      await loadFoodStats(f.id);
                    }}
                  >
                    <Text style={{ color: colors.textPrimary }}>
                      {f.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      {f.caloriesPer100g} kcal / 100g
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.star}
                    onPress={() => toggleFavorite(f.id)}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        color: favorites.has(f.id)
                          ? colors.accent
                          : colors.textSecondary,
                      }}
                    >
                      {favorites.has(f.id) ? "★" : "☆"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {selected && (
          <>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
              {selected.name}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              keyboardType="numeric"
              value={grams}
              onChangeText={setGrams}
            />

            <Text style={{ color: colors.textPrimary }}>
              {g} g • {calories} kcal
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Protein {protein}g | Carbs {carbs}g | Fats {fats}g
            </Text>

            <TouchableOpacity
              onPress={saveMeal}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={styles.primaryText}>Save</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
