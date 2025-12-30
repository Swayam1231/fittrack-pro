import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../src/firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useTheme } from "../src/context/ThemeContext";
import { FOOD_LIBRARY } from "../src/data/foodLibraryData";

/* ================= TYPES ================= */

/**
 * Runtime-safe food shape
 * (matches FOOD_LIBRARY exactly)
 */
type BaseFood = {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
};

type FavoriteFood = BaseFood & {
  lastUsedGrams?: number;
};

/* ================= COMPONENT ================= */

export default function FavoriteFoods() {
  const router = useRouter();
  const { colors } = useTheme();
  const uid = auth.currentUser?.uid;

  const [foods, setFoods] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const loadFavorites = async () => {
      setLoading(true);

      // 1️⃣ Build lookup map from raw food library
      const foodMap = new Map<string, BaseFood>();
      FOOD_LIBRARY.forEach((f) => foodMap.set(f.id, f));

      // 2️⃣ Fetch favorite food IDs
      const snap = await getDocs(
        query(
          collection(db, "users", uid, "foodStats"),
          where("favorite", "==", true)
        )
      );

      // 3️⃣ Join Firestore + Food Library
      const favs: FavoriteFood[] = [];

      snap.forEach((doc) => {
        const food = foodMap.get(doc.id);
        if (!food) return;

        favs.push({
          ...food,
          lastUsedGrams: doc.data().lastUsedGrams,
        });
      });

      setFoods(favs);
      setLoading(false);
    };

    loadFavorites();
  }, [uid]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          ⭐ Favorite Foods
        </Text>

        {loading && (
          <Text style={{ color: colors.textSecondary }}>
            Loading favorites…
          </Text>
        )}

        {!loading && foods.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>
            No favorites yet. Tap ☆ on a food to add it.
          </Text>
        )}

        {foods.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/add-meal",
                params: { foodId: f.id },
              })
            }
          >
            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
              {f.name}
            </Text>

            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {f.caloriesPer100g} kcal / 100g
              {f.lastUsedGrams
                ? ` • Last used: ${f.lastUsedGrams} g`
                : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
});
