import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { FirestoreService } from "../src/services/firestore.service";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { Loading } from "../src/components/Loading";
import { Card } from "../src/components/Card";

/* ================= COMPONENT ================= */

export default function FavoriteFoods() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const uid = user?.uid;

  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD FAVORITES ---------- */
  useEffect(() => {
    if (!uid) return;
    return FirestoreService.subscribeToFavoriteFoods(uid, (data) => {
      setFoods(data);
      setLoading(false);
    });
  }, [uid]);

  /* ---------- UNFAVORITE ---------- */
  const unfavorite = async (id: string) => {
    if (!uid || !id) return;
    await FirestoreService.unfavoriteFood(uid, id);
  };

  if (loading) return <Loading label="Loading favorites..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: 8, letterSpacing: -1 }}>Favorites</Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 32 }}>Your most tracked items</Text>
        </Animated.View>

        {foods.length === 0 ? (
          <View style={{ padding: 60, alignItems: "center" }}>
            <Ionicons name="star-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Text style={{ color: colors.textSecondary, textAlign: "center", fontWeight: "600" }}>No favorites yet</Text>
          </View>
        ) : (
          foods.map((f, i) => (
            <Animated.View key={f.id} entering={FadeInDown.delay(i * 100).duration(600)}>
              <Card style={{ marginBottom: 12, padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 16, marginBottom: 4 }}>{f.foodName}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {f.caloriesPer100g} kcal / 100g {f.lastUsedGrams ? `• ${f.lastUsedGrams}g` : ""}
                    </Text>
                  </View>

                  <Pressable onPress={() => unfavorite(f.id)} style={{ padding: 8 }}>
                    <Ionicons name="star" size={24} color={colors.warning} />
                  </Pressable>
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
