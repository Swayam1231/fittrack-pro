import { useLocalSearchParams, useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../src/context/AuthContext";
import { FirestoreService } from "../src/services/firestore.service";
import { LinearGradient } from "expo-linear-gradient";
import {
  FoodLibraryItem,
  getRecentSearches,
  loadFoodLibrary,
  searchFoods,
} from "../src/data/foodLibrary";

const { width } = Dimensions.get("window");

type RouteParams = {
  mealType?: string;
  date?: string;
};

export default function AddMeal() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const { colors, gradients } = useTheme();
  const { user } = useAuth();
  const uid = user?.uid;

  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<FoodLibraryItem[]>([]);
  const [selected, setSelected] = useState<FoodLibraryItem | null>(null);
  const [grams, setGrams] = useState("100");
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    loadFoodLibrary();
    if (uid) return FirestoreService.subscribeToFavoriteMeals(uid, setFavorites);
  }, [uid]);

  const onSearch = (text: string) => {
    setQueryText(text);
    setResults(searchFoods(text));
  };

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
      <View style={styles.header}>
         <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
         </Pressable>
         <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Log {params.mealType}</Text>
         <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
         {/* --- SEARCH BAR --- */}
         <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLow }]}>
               <Ionicons name="search" size={20} color={colors.textSecondary} />
               <TextInput 
                 placeholder="Search 10,000+ foods..." 
                 placeholderTextColor={colors.onSurfaceVariant}
                 value={queryText}
                 onChangeText={onSearch}
                 style={[styles.searchInput, { color: colors.textPrimary, fontFamily: 'Manrope-Medium' }]}
               />
            </View>
         </View>

         {!selected && !queryText && favorites.length > 0 && (
            <View style={styles.section}>
               <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>SUGGESTED FOR YOU</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favScroll}>
                  {favorites.map((f, i) => (
                     <Pressable key={i} style={[styles.favCard, { backgroundColor: colors.surfaceContainerLow }]}>
                        <View style={[styles.favIcon, { backgroundColor: colors.surfaceContainerHighest }]}>
                           <Ionicons name="star" size={16} color={colors.primary} />
                        </View>
                        <Text style={[styles.favName, { color: colors.textPrimary, fontFamily: 'Manrope-Bold' }]}>{f.foodName}</Text>
                        <Text style={[styles.favCals, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Medium' }]}>{f.calories} kcal</Text>
                     </Pressable>
                  ))}
               </ScrollView>
            </View>
         )}

         {queryText && !selected && (
            <View style={styles.resultsSection}>
               {results.map((f, i) => (
                  <Pressable 
                    key={f.id} 
                    onPress={() => setSelected(f)}
                    style={[styles.resultItem, { backgroundColor: colors.surfaceContainerLowest }]}
                  >
                     <View>
                        <Text style={[styles.resultName, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{f.name}</Text>
                        <Text style={[styles.resultMeta, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>{f.caloriesPer100g} kcal / 100g</Text>
                     </View>
                     <Ionicons name="add-circle" size={24} color={colors.primary} />
                  </Pressable>
               ))}
            </View>
         )}

         {selected && (
            <Animated.View entering={FadeInUp} style={styles.detailsSection}>
               <View style={[styles.detailsCard, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={[styles.detailsName, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{selected.name}</Text>
                  
                  <View style={styles.inputGroup}>
                     <Text style={[styles.label, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>SERVING SIZE (G)</Text>
                     <TextInput 
                        value={grams} 
                        onChangeText={setGrams} 
                        keyboardType="numeric"
                        style={[styles.gramInput, { backgroundColor: colors.surfaceContainerHighest, color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}
                     />
                  </View>

                  <View style={styles.macroRow}>
                     <MacroBadge label="PRO" val={Math.round((selected.proteinPer100g * Number(grams))/100)} color={colors.success} />
                     <MacroBadge label="CHO" val={Math.round((selected.carbsPer100g * Number(grams))/100)} color={colors.primary} />
                     <MacroBadge label="FAT" val={Math.round((selected.fatsPer100g * Number(grams))/100)} color={colors.secondary} />
                  </View>

                  <Pressable onPress={saveMeal} style={styles.logBtn}>
                     <LinearGradient colors={gradients.primary} style={styles.logBtnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                        <Text style={[styles.logBtnText, { fontFamily: 'Manrope-Bold' }]}>LOG {Math.round((selected.caloriesPer100g * Number(grams))/100)} KCAL</Text>
                     </LinearGradient>
                  </Pressable>

                  <Pressable onPress={() => setSelected(null)} style={styles.cancelBtn}>
                     <Text style={[styles.cancelText, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>Cancel</Text>
                  </Pressable>
               </View>
            </Animated.View>
         )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBadge({ label, val, color }: any) {
  const { colors } = useTheme();
  return (
    <View style={[styles.macroBadge, { backgroundColor: colors.surfaceContainerHighest }]}>
       <Text style={[styles.macroBadgeLabel, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>{label}</Text>
       <Text style={[styles.macroBadgeVal, { color: color, fontFamily: 'SpaceGrotesk-Bold' }]}>{val}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, letterSpacing: -0.5 },
  scroll: { paddingBottom: 60 },
  searchSection: { paddingHorizontal: 24, marginVertical: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 28, paddingHorizontal: 20, gap: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginLeft: 24, marginBottom: 16 },
  favScroll: { paddingHorizontal: 24, gap: 12 },
  favCard: { width: 140, padding: 16, borderRadius: 24 },
  favIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  favName: { fontSize: 14, marginBottom: 4 },
  favCals: { fontSize: 12, opacity: 0.6 },
  resultsSection: { paddingHorizontal: 24, gap: 12 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20 },
  resultName: { fontSize: 16 },
  resultMeta: { fontSize: 12, marginTop: 2 },
  detailsSection: { paddingHorizontal: 24 },
  detailsCard: { borderRadius: 32, padding: 24 },
  detailsName: { fontSize: 28, letterSpacing: -1, marginBottom: 24 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 9, letterSpacing: 0.5, marginBottom: 8 },
  gramInput: { height: 60, borderRadius: 16, textAlign: 'center', fontSize: 24 },
  macroRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  macroBadge: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center' },
  macroBadgeLabel: { fontSize: 9, marginBottom: 4 },
  macroBadgeVal: { fontSize: 16 },
  logBtn: { height: 64, borderRadius: 32, overflow: 'hidden' },
  logBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logBtnText: { color: '#fff', fontSize: 16, letterSpacing: 0.5 },
  cancelBtn: { marginTop: 16, padding: 12, alignItems: 'center' },
  cancelText: { fontSize: 14 },
});
