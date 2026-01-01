import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
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
  FoodLibraryItem,
  loadFoodLibrary,
  searchFoods,
} from "../src/data/foodLibrary";
import { auth, db } from "../src/firebase/firebase";

/* ================= TYPES ================= */

type RouteParams = {
  mealType?: string;
  scannedFood?: string; // reused later by AI flow
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
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
    marginBottom: 16,
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
  const [selected, setSelected] = useState<FoodLibraryItem | null>(null);
  const [grams, setGrams] = useState("100");

  /* ================= LOAD FOOD LIBRARY ================= */

  useEffect(() => {
    loadFoodLibrary();
  }, []);

  /* ================= LOAD FAVORITES ================= */

  useEffect(() => {
    if (!uid) return;

    const loadFavorites = async () => {
      const snap = await getDocs(
        collection(db, "users", uid, "foodStats")
      );

      const favs = new Set<string>();
      snap.forEach((d) => {
        if (d.data().favorite) favs.add(d.id);
      });

      setFavorites(favs);
    };

    loadFavorites();
  }, [uid]);

  /* ================= HANDLE AI RESULT ================= */

  useEffect(() => {
    if (!params.scannedFood) return;

    try {
      const f = JSON.parse(params.scannedFood);
      setSelected(f as FoodLibraryItem);
      setGrams("100");
      setQueryText("");
      setResults([]);
    } catch {}
  }, [params.scannedFood]);

  /* ================= SEARCH ================= */

  const onSearch = (text: string) => {
    setQueryText(text);
    setResults(searchFoods(text));
  };

  /* ================= FAVORITE TOGGLE ================= */

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
      { merge: true }
    );

    setFavorites((prev) => {
      const n = new Set(prev);
      isFav ? n.delete(food.id) : n.add(food.id);
      return n;
    });
  };

  /* ================= SAVE MEAL ================= */

  const saveMeal = async () => {
    if (!uid || !selected) return;

    await addDoc(collection(db, "users", uid, "meals"), {
      foodId: selected.id,
      foodName: selected.name,
      grams: Number(grams),
      mealType: params.mealType || "Breakfast",
      createdAt: Timestamp.now(),
    });

    router.back();
  };

  /* ================= CALCULATIONS ================= */

  const g = Number(grams) || 0;
  const calories = selected
    ? Math.round((selected.caloriesPer100g * g) / 100)
    : 0;

  /* ================= UI ================= */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Add Meal
        </Text>

        {/* 🔥 AI SCAN MEAL */}
        <TouchableOpacity
          onPress={() => router.push("../ai-scan-meal")}
          style={[
            styles.aiButton,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text style={styles.primaryText}>
            📸 AI Scan Meal
          </Text>
        </TouchableOpacity>

        {/* FAVORITES + CUSTOM */}
        <TouchableOpacity
          onPress={() => router.push("/favorite-foods")}
          style={styles.link}
        >
          <Text style={{ color: colors.accent }}>
            ⭐ View Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/add-custom-food")}
          style={styles.link}
        >
          <Text style={{ color: colors.accent }}>
            + Add Custom Food
          </Text>
        </TouchableOpacity>

        {/* SEARCH */}
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
                  onPress={() => setSelected(f)}
                >
                  <Text style={{ color: colors.textPrimary }}>
                    {f.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {f.caloriesPer100g} kcal / 100g
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.star}
                  onPress={() => toggleFavorite(f)}
                >
                  <Text style={{ fontSize: 20 }}>
                    {favorites.has(f.id) ? "★" : "☆"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

        {selected && (
          <>
            <Text style={{ color: colors.textPrimary }}>
              {selected.name}
            </Text>

            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card },
              ]}
              keyboardType="numeric"
              value={grams}
              onChangeText={setGrams}
            />

            <Text style={{ color: colors.textPrimary }}>
              {calories} kcal
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
