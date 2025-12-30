import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../src/firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import { useTheme } from "../src/context/ThemeContext";

/* ================= TYPES ================= */

type FavoriteFood = {
  id: string; // 🔴 Firestore document ID (REQUIRED)
  foodName: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatsPer100g?: number;
  lastUsedGrams?: number;
};

/* ================= COMPONENT ================= */

export default function FavoriteFoods() {
  const { colors } = useTheme();
  const uid = auth.currentUser?.uid;

  const [foods, setFoods] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD FAVORITES ---------- */
  useEffect(() => {
    if (!uid) return;

    const loadFavorites = async () => {
      setLoading(true);

      const snap = await getDocs(
        query(
          collection(db, "users", uid, "foodStats"),
          where("favorite", "==", true)
        )
      );

      // ✅ IMPORTANT: attach doc.id explicitly
      const favs: FavoriteFood[] = snap.docs.map((d) => ({
        id: d.id, // 🔑 THIS FIXES THE CRASH
        ...(d.data() as Omit<FavoriteFood, "id">),
      }));

      setFoods(favs);
      setLoading(false);
    };

    loadFavorites();
  }, [uid]);

  /* ---------- UNFAVORITE ---------- */
  const unfavorite = async (id: string) => {
    if (!uid || !id) return;

    // Firestore update
    await setDoc(
      doc(db, "users", uid, "foodStats", id),
      { favorite: false },
      { merge: true }
    );

    // Instant UI update
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  /* ================= UI ================= */

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
            No favorites yet.
          </Text>
        )}

        {foods.map((f) => (
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
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: colors.textPrimary, fontWeight: "600" }}
                >
                  {f.foodName}
                </Text>

                <Text
                  style={{ color: colors.textSecondary, fontSize: 12 }}
                >
                  {f.caloriesPer100g} kcal / 100g
                  {f.lastUsedGrams
                    ? ` • Last used ${f.lastUsedGrams} g`
                    : ""}
                </Text>
              </View>

              {/* ⭐ UNFAVORITE */}
              <TouchableOpacity
                onPress={() => unfavorite(f.id)}
                style={styles.star}
              >
                <Text
                  style={{
                    fontSize: 20,
                    color: colors.accent,
                  }}
                >
                  ★
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
