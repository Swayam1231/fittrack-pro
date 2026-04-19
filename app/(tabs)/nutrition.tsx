import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions, TextInput, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { format } from "date-fns";
import { FirestoreService } from "../../src/services/firestore.service";
import { Loading } from "../../src/components/Loading";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;

export default function Nutrition() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;
  const { colors, gradients } = useTheme();

  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 60,
  });

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      FirestoreService.subscribeToProfile(uid, (data) => {
        if (!data) return;
        setTargets({
          calories: data.targets.calories ?? 2000,
          protein: data.targets.protein ?? 150,
          carbs: data.targets.carbs ?? 200,
          fats: data.targets.fats ?? 60,
        });
      });
      return FirestoreService.subscribeToMealsByDate(uid, date, (data) => {
        setMeals(data);
        setLoading(false);
      });
    }, [uid, date])
  );

  const totals = useMemo(() => {
    return meals.reduce((a, m) => {
      a.calories += Number(m.calories || 0);
      a.protein += Number(m.protein || 0);
      a.carbs += Number(m.carbs || 0);
      a.fats += Number(m.fats || 0);
      return a;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [meals]);

  const mealsByType = useMemo(() => {
    const map: Record<typeof MEAL_TYPES[number], any[]> = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
    meals.forEach((m) => {
      const type = (m.mealType || "Breakfast") as typeof MEAL_TYPES[number];
      if (map[type]) map[type].push(m);
    });
    return map;
  }, [meals]);

  if (loading) return <Loading label="Calibrating Macros..." />;

  const remaining = Math.max(targets.calories - totals.calories, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* --- TOP APP BAR --- */}
      <View style={styles.header}>
        <View style={styles.dateSelector}>
           <Pressable onPress={() => setDate(new Date(date.setDate(date.getDate() - 1)))}>
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
           </Pressable>
           <Text style={[styles.headerDate, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{format(date, "EEEE, MMM d")}</Text>
           <Pressable onPress={() => setDate(new Date(date.setDate(date.getDate() + 1)))}>
              <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
           </Pressable>
        </View>
        <Pressable onPress={() => router.push("../profile")} style={styles.avatarBtn}>
            <Image 
              source={user?.photoURL ? { uri: user.photoURL } : require("../../assets/images/default-avatar.png")} 
              style={styles.avatar} 
            />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
         {/* --- SEARCH --- */}
         <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLow }]}>
               <Ionicons name="search" size={20} color={colors.textSecondary} />
               <TextInput 
                 placeholder="Search foods, brands..." 
                 placeholderTextColor={colors.onSurfaceVariant}
                 style={[styles.searchInput, { color: colors.textPrimary, fontFamily: 'Manrope-Medium' }]}
               />
               <Pressable style={styles.scanBtn}>
                  <Ionicons name="barcode-outline" size={20} color={colors.primary} />
               </Pressable>
            </View>
         </View>

         {/* --- SUMMARY CARD --- */}
         <View style={styles.summarySection}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surfaceContainerLow }]}>
               <View style={styles.summaryTop}>
                  <View>
                     <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>CALORIES REMAINING</Text>
                     <Text style={[styles.summaryVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{remaining}</Text>
                  </View>
                  <View style={styles.summaryRing}>
                     <LinearGradient colors={gradients.primary} style={styles.ringInner} start={{x:0, y:0}} end={{x:1, y:1}}>
                        <Text style={[styles.ringText, { fontFamily: 'SpaceGrotesk-Bold' }]}>{Math.round((totals.calories/targets.calories)*100)}%</Text>
                     </LinearGradient>
                  </View>
               </View>

               <View style={styles.macroGrid}>
                  <MacroItem label="Protein" current={totals.protein} target={targets.protein} color={colors.success} />
                  <MacroItem label="Carbs" current={totals.carbs} target={targets.carbs} color={colors.primary} />
                  <MacroItem label="Fats" current={totals.fats} target={targets.fats} color={colors.secondary} />
               </View>
            </View>
         </View>

         {/* --- RAPID LOG --- */}
         <View style={styles.rapidSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Rapid Log</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rapidScroll}>
               <RapidCard icon="cafe" label="Black Coffee" cals="5" color="#795548" />
               <RapidCard icon="egg" label="Boiled Egg" cals="78" color="#FFD54F" />
               <RapidCard icon="fitness" label="Whey Shake" cals="120" color={colors.primary} />
               <RapidCard icon="water" label="1L Water" cals="0" color="#4FC3F7" />
            </ScrollView>
         </View>

         {/* --- MEAL LOGS --- */}
         <View style={styles.logsSection}>
            {MEAL_TYPES.map((type, index) => (
               <MealGroup 
                 key={type} 
                 title={type} 
                 meals={mealsByType[type]} 
                 colors={colors} 
                 index={index}
                 onAdd={() => router.push({ pathname: "/add-meal", params: { mealType: type, date: date.toISOString() } })}
               />
            ))}
         </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroItem({ label, current, target, color }: any) {
  const { colors } = useTheme();
  const progress = Math.min(current / target, 1);
  return (
    <View style={styles.macroItem}>
       <View style={styles.macroHeader}>
          <Text style={[styles.macroLabel, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>{label.toUpperCase()}</Text>
          <Text style={[styles.macroVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{current}g</Text>
       </View>
       <View style={[styles.macroTrack, { backgroundColor: colors.surfaceContainerHighest }]}>
          <View style={[styles.macroFill, { backgroundColor: color, width: `${progress * 100}%` }]} />
       </View>
    </View>
  );
}

function RapidCard({ icon, label, cals, color }: any) {
  const { colors: themeColors } = useTheme();
  return (
    <Pressable style={[styles.rapidCard, { backgroundColor: themeColors.surfaceContainerLow }]}>
       <View style={[styles.rapidIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={22} color={color} />
       </View>
       <Text style={[styles.rapidLabel, { color: themeColors.textPrimary, fontFamily: 'Manrope-Bold' }]}>{label}</Text>
       <Text style={[styles.rapidCals, { color: themeColors.onSurfaceVariant, fontFamily: 'SpaceGrotesk-Medium' }]}>{cals} kcal</Text>
    </Pressable>
  );
}

function MealGroup({ title, meals, colors, index, onAdd }: any) {
  return (
    <Animated.View entering={FadeInUp.delay(300 + index * 100)} style={styles.mealGroup}>
       <View style={styles.groupHeader}>
          <Text style={[styles.groupTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{title}</Text>
          <Pressable onPress={onAdd}>
             <Ionicons name="add-circle" size={24} color={colors.primary} />
          </Pressable>
       </View>
       {meals.length === 0 ? (
          <View style={[styles.emptyMeal, { backgroundColor: colors.surfaceContainerLow }]}>
             <Text style={[styles.emptyText, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Medium' }]}>Nothing logged for {title}</Text>
          </View>
       ) : (
          meals.map((meal: any) => (
             <View key={meal.id} style={[styles.mealItem, { backgroundColor: colors.surfaceContainerLowest }]}>
                <View>
                   <Text style={[styles.mealName, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{meal.foodName}</Text>
                   <Text style={[styles.mealGrams, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>{meal.grams}g • P: {meal.protein}g C: {meal.carbs}g F: {meal.fats}g</Text>
                </View>
                <Text style={[styles.mealCals, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{meal.calories}</Text>
             </View>
          ))
       )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16 
  },
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerDate: { fontSize: 18, letterSpacing: -0.5 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  scroll: { paddingBottom: 100 },
  searchSection: { paddingHorizontal: 24, marginVertical: 16 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: 56, 
    borderRadius: 28,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  scanBtn: { padding: 4 },
  summarySection: { paddingHorizontal: 24, marginBottom: 32 },
  summaryCard: { borderRadius: 32, padding: 24 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  summaryLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  summaryVal: { fontSize: 48, letterSpacing: -2 },
  summaryRing: { width: 72, height: 72, borderRadius: 36, padding: 4, backgroundColor: 'rgba(0,0,0,0.05)' },
  ringInner: { flex: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  ringText: { color: '#fff', fontSize: 14 },
  macroGrid: { flexDirection: 'row', gap: 12 },
  macroItem: { flex: 1 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  macroLabel: { fontSize: 9, letterSpacing: 0.5 },
  macroVal: { fontSize: 14 },
  macroTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 2 },
  rapidSection: { marginBottom: 40 },
  sectionTitle: { fontSize: 20, marginLeft: 24, marginBottom: 16 },
  rapidScroll: { paddingHorizontal: 24, gap: 12 },
  rapidCard: { width: 120, padding: 16, borderRadius: 24, alignItems: 'center' },
  rapidIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  rapidLabel: { fontSize: 12, textAlign: 'center' },
  rapidCals: { fontSize: 11, marginTop: 4, opacity: 0.6 },
  logsSection: { paddingHorizontal: 24, gap: 32 },
  mealGroup: { gap: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupTitle: { fontSize: 22, letterSpacing: -0.5 },
  emptyMeal: { padding: 16, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  emptyText: { fontSize: 13, opacity: 0.5 },
  mealItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20 },
  mealName: { fontSize: 16, letterSpacing: -0.3 },
  mealGrams: { fontSize: 12, marginTop: 2 },
  mealCals: { fontSize: 18, letterSpacing: -0.5 },
});
