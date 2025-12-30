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

  useEffect(() => {
    loadFoodLibrary();
  }, []);

  const onSearch = (text: string) => {
    setQueryText(text);
    setResults(searchFoods(text));
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
      { merge: true }
    );

    setFavorites((p) => {
      const n = new Set(p);
      isFav ? n.delete(food.id) : n.add(food.id);
      return n;
    });
  };

  /* SAVE MEAL */
  const saveMeal = async () => {
    if (!uid || !selected) return;

    await addDoc(collection(db, "users", uid, "meals"), {
      foodId: selected.id,
      foodName: selected.name,
      grams: Number(grams),
      mealType: params.mealType || "Breakfast",
      createdAt: Timestamp.now(),
    });

    await setDoc(
      doc(db, "users", uid, "foodStats", selected.id),
      {
        lastUsedGrams: Number(grams),
        favorite: favorites.has(selected.id),
      },
      { merge: true }
    );

    router.back();
  };

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
          <Text style={{ color: colors.accent }}>
            + Add Custom Food
          </Text>
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

        {results.map((f) => (
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
                onPress={() => setSelected(f)}
              >
                <Text style={{ color: colors.textPrimary }}>
                  {f.name}
                </Text>
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
          <TouchableOpacity
            onPress={saveMeal}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text style={styles.primaryText}>Save</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
