import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/context/ThemeContext";
import {
  clearRecentSearches,
  FoodLibraryItem,
  getRecentSearches,
  loadFoodLibrary,
  saveRecentSearch,
  searchFoods,
} from "../src/data/foodLibrary";
import { auth, db } from "../src/firebase/firebase";

/* ================= TYPES ================= */

type RouteParams = {
  mealType?: string;
};

type PortionPreset = {
  label: string;
  grams: number;
};

/* ================= PORTION PRESETS ================= */

const PORTION_PRESETS: Record<string, PortionPreset[]> = {
  rice: [
    { label: "1 bowl", grams: 150 },
    { label: "1 plate", grams: 250 },
  ],
  roti: [
    { label: "1 piece", grams: 40 },
    { label: "2 pieces", grams: 80 },
  ],
  paratha: [{ label: "1 piece", grams: 80 }],
  dosa: [{ label: "1 piece", grams: 120 }],
  idli: [{ label: "1 piece", grams: 50 }],
  dal: [
    { label: "1 bowl", grams: 150 },
    { label: "1 cup", grams: 200 },
  ],
  curry: [
    { label: "1 bowl", grams: 180 },
    { label: "1 cup", grams: 220 },
  ],
  chicken: [{ label: "1 piece", grams: 150 }],
  egg: [{ label: "1 piece", grams: 50 }],
  paneer: [
    { label: "1 serving", grams: 100 },
    { label: "2 servings", grams: 200 },
  ],
  samosa: [{ label: "1 piece", grams: 100 }],
  vada: [{ label: "1 piece", grams: 90 }],
  momos: [{ label: "6 pieces", grams: 180 }],
  burger: [{ label: "1 piece", grams: 180 }],
  default: [
    { label: "100 g", grams: 100 },
    { label: "200 g", grams: 200 },
  ],
};

const getPortionPresets = (foodName: string): PortionPreset[] => {
  const name = foodName.toLowerCase();
  for (const key of Object.keys(PORTION_PRESETS)) {
    if (key !== "default" && name.includes(key)) {
      return PORTION_PRESETS[key];
    }
  }
  return PORTION_PRESETS.default;
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

  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },

  star: { paddingHorizontal: 14, paddingVertical: 10 },

  preset: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },

  primaryButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  primaryText: { color: "#fff", fontWeight: "600" },
  link: { marginBottom: 12 },

  aiButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  aiBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },

  aiBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selected, setSelected] = useState<FoodLibraryItem | null>(null);
  const [grams, setGrams] = useState("100");

  useEffect(() => {
    loadFoodLibrary();
    getRecentSearches().then(setRecentSearches);
  }, []);

  const onSearch = (text: string) => {
    setQueryText(text);
    setResults(searchFoods(text));
  };

  const clearRecent = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  /* ⭐ FAVORITE */
  const toggleFavorite = async (food: FoodLibraryItem) => {
    if (!uid) return;

    const isFav = favorites.has(food.id);

    await setDoc(
      doc(db, "users", uid, "foodStats", food.id),
      {
        foodId: food.id,
        foodName: food.name,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatsPer100g: food.fatsPer100g,
        favorite: !isFav,
      },
      { merge: true },
    );

    setFavorites((p) => {
      const n = new Set(p);
      if (isFav) {
        n.delete(food.id);
      } else {
        n.add(food.id);
      }
      return n;
    });
  };

  /* SAVE MEAL */
  const saveMeal = async () => {
    if (!uid || !selected) return;

    const g = Number(grams) || 0;

    const calories = Math.round((selected.caloriesPer100g * g) / 100);
    const protein = Math.round((selected.proteinPer100g * g) / 100);
    const carbs = Math.round((selected.carbsPer100g * g) / 100);
    const fats = Math.round((selected.fatsPer100g * g) / 100);

    await addDoc(collection(db, "users", uid, "meals"), {
      foodId: selected.id,
      foodName: selected.name,
      grams: g,
      mealType: params.mealType || "Breakfast",
      calories,
      protein,
      carbs,
      fats,
      createdAt: Timestamp.now(),
    });

    await setDoc(
      doc(db, "users", uid, "foodStats", selected.id),
      {
        lastUsedGrams: Number(grams),
        favorite: favorites.has(selected.id),
      },
      { merge: true },
    );

    router.back();
  };

  const g = Number(grams) || 0;
  const calories = selected
    ? Math.round((selected.caloriesPer100g * g) / 100)
    : 0;
  const protein = selected
    ? Math.round((selected.proteinPer100g * g) / 100)
    : 0;
  const carbs = selected ? Math.round((selected.carbsPer100g * g) / 100) : 0;
  const fats = selected ? Math.round((selected.fatsPer100g * g) / 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Add Meal
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/favorite-foods")}
          style={styles.link}
        >
          <Text style={{ color: colors.accent, fontWeight: "600" }}>
            ⭐ View Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/add-custom-food")}
          style={styles.link}
        >
          <Text style={{ color: colors.accent }}>+ Add Custom Food</Text>
        </TouchableOpacity>

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

        {/* 🔍 RECENT SEARCHES */}
        {!queryText && !selected && recentSearches.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ color: colors.textSecondary }}>
                Recent searches
              </Text>

              <TouchableOpacity onPress={clearRecent}>
                <Text style={{ color: colors.accent, fontSize: 12 }}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {recentSearches.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => {
                    setQueryText(r);
                    setResults(searchFoods(r));
                  }}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    backgroundColor: colors.card,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12 }}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!selected &&
          results.map((f) => (
            <View
              key={f.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.grow}
                  onPress={() => {
                    saveRecentSearch(queryText);
                    setSelected(f);
                  }}
                >
                  <Text style={{ color: colors.textPrimary }}>{f.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {f.caloriesPer100g} kcal / 100g
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.star}
                  onPress={() => toggleFavorite(f)}
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

        {selected && (
          <>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
              {selected.name}
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginVertical: 8,
              }}
            >
              {getPortionPresets(selected.name).map((p) => (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => setGrams(String(p.grams))}
                  style={[styles.preset, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12 }}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.primaryText}>Save</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
