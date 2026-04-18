import { useLocalSearchParams, useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../src/context/AuthContext";
import { FirestoreService } from "../src/services/firestore.service";
import {
  clearRecentSearches,
  FoodLibraryItem,
  getRecentSearches,
  loadFoodLibrary,
  saveRecentSearch,
  searchFoods,
} from "../src/data/foodLibrary";

/* ================= TYPES ================= */

type RouteParams = {
  mealType?: string;
  date?: string;
  scannedName?: string;
  scannedCal?: string;
  scannedPro?: string;
  scannedCarb?: string;
  scannedFat?: string;
};

type PortionPreset = {
  label: string;
  grams: number;
};

/* ================= PORTION PRESETS ================= */

const PORTION_PRESETS: Record<string, PortionPreset[]> = {
  // ... (keeping the same presets for brevity as they are data)
  rice: [{ label: "1 bowl", grams: 150 }, { label: "1 plate", grams: 250 }],
  roti: [{ label: "1 piece", grams: 40 }, { label: "2 pieces", grams: 80 }],
  dal: [{ label: "1 bowl", grams: 150 }, { label: "1 cup", grams: 200 }],
  chicken: [{ label: "1 piece", grams: 150 }],
  egg: [{ label: "1 piece", grams: 50 }],
  paneer: [{ label: "1 serving", grams: 100 }],
  default: [{ label: "100 g", grams: 100 }, { label: "200 g", grams: 200 }],
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

/* ================= COMPONENT ================= */

export default function AddMeal() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const uid = user?.uid;

  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<FoodLibraryItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selected, setSelected] = useState<FoodLibraryItem | null>(null);
  const [grams, setGrams] = useState("100");

  const [favoriteMealTemplates, setFavoriteMealTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadFoodLibrary();
    getRecentSearches().then(setRecentSearches);
    if (uid) return FirestoreService.subscribeToFavoriteMeals(uid, setFavoriteMealTemplates);
  }, [uid]);

  const logFavoriteMeal = async (m: any) => {
    if (!uid) return;
    await FirestoreService.addMeal(uid, {
      foodName: m.foodName,
      grams: m.grams,
      mealType: params.mealType || "Breakfast",
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fats: m.fats,
      createdAt: Timestamp.now(),
    });
    router.back();
  };

  useEffect(() => {
    if (params.scannedName) {
      setSelected({
        id: "scanned_" + Date.now(),
        name: params.scannedName,
        caloriesPer100g: Number(params.scannedCal) || 0,
        proteinPer100g: Number(params.scannedPro) || 0,
        carbsPer100g: Number(params.scannedCarb) || 0,
        fatsPer100g: Number(params.scannedFat) || 0,
      });
    }
  }, [params.scannedName]);

  const onSearch = (text: string) => {
    setQueryText(text);
    setResults(searchFoods(text));
  };

  const clearRecent = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  /* SAVE MEAL */
  const saveMeal = async () => {
    if (!uid || !selected) return;

    const g = Number(grams) || 0;
    const calories = Math.round((selected.caloriesPer100g * g) / 100);
    const protein = Math.round((selected.proteinPer100g * g) / 100);
    const carbs = Math.round((selected.carbsPer100g * g) / 100);
    const fats = Math.round((selected.fatsPer100g * g) / 100);

    await FirestoreService.addMeal(uid, {
      foodName: selected.name,
      grams: g,
      mealType: params.mealType || "Breakfast",
      calories,
      protein,
      carbs,
      fats,
      createdAt: Timestamp.now(),
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: 8, letterSpacing: -1 }}>
               Log {params.mealType || "Meal"}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24 }}>What did you eat today?</Text>
        </Animated.View>

        {favoriteMealTemplates.length > 0 && !selected && !queryText && (
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ marginBottom: 24 }}>
             <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 }}>Favorites</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {favoriteMealTemplates.map((m) => (
                  <TouchableOpacity 
                    key={m.id}
                    onPress={() => logFavoriteMeal(m)}
                    style={{ backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, minWidth: 150 }}
                  >
                     <Text style={{ color: colors.textPrimary, fontWeight: "700", marginBottom: 4 }}>{m.foodName}</Text>
                     <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{m.calories} kcal • {m.grams}g</Text>
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 4, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginLeft: 16, marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, height: 50, color: colors.textPrimary, fontSize: 16 }}
                  placeholder="Search 10,000+ foods..."
                  placeholderTextColor={colors.textSecondary}
                  value={queryText}
                  onChangeText={onSearch}
                />
                <TouchableOpacity onPress={() => router.push("/scanner")} style={{ padding: 12, backgroundColor: `${colors.primary}15`, borderRadius: 12, marginRight: 4 }}>
                    <Ionicons name="barcode-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </Animated.View>

        {queryText && !selected && (
            <Animated.View entering={FadeInDown.duration(400)}>
                {results.map((f, i) => (
                    <TouchableOpacity 
                        key={f.id} 
                        onPress={() => setSelected(f)}
                        style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                    >
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>{f.name}</Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary }}>{f.caloriesPer100g} kcal per 100g</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                ))}
            </Animated.View>
        )}

        {selected && (
            <Animated.View entering={FadeInDown.duration(600)}>
                <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 24, fontWeight: "800", color: colors.textPrimary, marginBottom: 4 }}>{selected.name}</Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>Specify portion size below</Text>

                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 }}>Select Portion</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
                        {getPortionPresets(selected.name).map((p) => (
                            <TouchableOpacity
                                key={p.label}
                                onPress={() => setGrams(String(p.grams))}
                                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: Number(grams) === p.grams ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: "600", color: Number(grams) === p.grams ? "#fff" : colors.textPrimary }}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 }}>Custom Grams</Text>
                    <TextInput
                        style={{ backgroundColor: colors.surface, borderRadius: 12, height: 50, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 32, borderWidth: 1, borderColor: colors.border }}
                        keyboardType="numeric"
                        value={grams}
                        onChangeText={setGrams}
                    />

                    <View style={{ gap: 12, marginBottom: 32 }}>
                        <StatRow label="Calories" value={`${Math.round((selected.caloriesPer100g * Number(grams)) / 100)} kcal`} />
                        <StatRow label="Protein" value={`${Math.round((selected.proteinPer100g * Number(grams)) / 100)}g`} />
                        <StatRow label="Carbs" value={`${Math.round((selected.carbsPer100g * Number(grams)) / 100)}g`} />
                        <StatRow label="Fats" value={`${Math.round((selected.fatsPer100g * Number(grams)) / 100)}g`} />
                    </View>

                    <TouchableOpacity
                        onPress={saveMeal}
                        style={{ backgroundColor: colors.primary, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
                    >
                        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Log this Meal</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
    const { colors } = useTheme();
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "500" }}>{label}</Text>
            <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: "700" }}>{value}</Text>
        </View>
    );
}
