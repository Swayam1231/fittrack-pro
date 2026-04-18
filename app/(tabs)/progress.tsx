import { View, Text, ScrollView, Dimensions, Pressable, TextInput, Modal } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FirestoreService, Meal, Workout, UserProfile, WeightEntry } from "../../src/services/firestore.service";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";
import { MuscleHeatmap } from "../../src/components/MuscleHeatmap";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { startOfWeek, startOfDay, format } from "date-fns";
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

/* ================= HELPERS ================= */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ================= COMPONENT ================= */

export default function Progress() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { colors, gradients } = useTheme();

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  // Modal State
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  useEffect(() => {
    if (!uid) return;

    const unsubProfile = FirestoreService.subscribeToProfile(uid, setProfile);
    const unsubWeight = FirestoreService.subscribeToWeightHistory(uid, setWeightHistory);
    const unsubWorkouts = FirestoreService.subscribeToWorkoutHistory(uid, setWorkouts);
    const unsubMeals = FirestoreService.subscribeToMealsByDate(uid, new Date(), setMeals);
    
    setLoading(false);

    return () => {
      unsubProfile();
      unsubWeight();
      unsubWorkouts();
      unsubMeals();
    };
  }, [uid]);

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (!isNaN(w) && w > 0 && uid) {
      await FirestoreService.logWeight(uid, w);
      setWeightModalVisible(false);
      setNewWeight("");
    }
  };

  /* ================= WEEKLY DATA ================= */

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);

  const caloriesByDay = useMemo(() => {
    const arr = Array(7).fill(0);
    meals.forEach((m) => {
      if (!m.createdAt) return;
      const d = startOfDay(m.createdAt.toDate());
      if (d < weekStart) return;
      arr[(d.getDay() + 6) % 7] += m.calories || 0;
    });
    return arr;
  }, [meals, weekStart]);

  const workoutCaloriesByDay = useMemo(() => {
    const arr = Array(7).fill(0);
    workouts.forEach((w) => {
      if (!w.createdAt) return;
      const d = startOfDay(w.createdAt.toDate());
      if (d < weekStart) return;
      arr[(d.getDay() + 6) % 7] += w.caloriesBurned || 0;
    });
    return arr;
  }, [workouts, weekStart]);

  const totalWeeklyCalories = useMemo(() => caloriesByDay.reduce((a, b) => a + b, 0), [caloriesByDay]);
  const weeklyGoalCalories = useMemo(() => (profile?.targets?.calories || 2000) * 7, [profile]);

  if (loading) return <Loading label="Calculating progress..." />;

  // Display value for current weight
  const currentWeightDisplay = weightHistory.length > 0 
    ? weightHistory[weightHistory.length - 1].weight 
    : (profile?.weight || "--");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(600)}>
          <Text style={{ fontSize: 32, fontWeight: "800", color: colors.textPrimary, marginBottom: 8, letterSpacing: -1 }}>
            Insights
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24, fontWeight: "500" }}>
            Track your performance over time
          </Text>
        </Animated.View>

        {/* --- WEIGHT PROGRESS CHART --- */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Card style={{ marginBottom: 20, padding: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <View>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 }}>Body Weight</Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>Current: {currentWeightDisplay} kg</Text>
                    </View>
                    <Pressable 
                        onPress={() => setWeightModalVisible(true)}
                        style={{ backgroundColor: `${colors.primary}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                    >
                        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>+ Log</Text>
                    </Pressable>
                </View>

                <WeightLineChart data={weightHistory} color={colors.primary} />
            </Card>
        </Animated.View>

        {/* --- MUSCLE HEATMAP --- */}
        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
            <Card style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
                <MuscleHeatmap workouts={workouts} />
            </Card>
        </Animated.View>

        {/* --- WEEKLY SUMMARY HERO --- */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
             <LinearGradient
                colors={gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 }}
             >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <View>
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Weekly Adherence</Text>
                        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>
                           {((totalWeeklyCalories / weeklyGoalCalories) * 100).toFixed(0)}%
                        </Text>
                    </View>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="trending-up" size={24} color="#fff" />
                    </View>
                </View>

                <View style={{ height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                   <View style={{ height: "100%", width: `${Math.min((totalWeeklyCalories / weeklyGoalCalories) * 100, 100)}%`, backgroundColor: "#fff" }} />
                </View>
                
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "500" }}>
                   {totalWeeklyCalories.toLocaleString()} of {weeklyGoalCalories.toLocaleString()} kcal consumed this week
                </Text>
             </LinearGradient>
        </Animated.View>

        {/* --- CHARTS --- */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <ChartCard title="Calorie Intake" subtitle="Daily consumption vs time">
                 <EnhancedBarChart data={caloriesByDay} color={colors.warning} />
            </ChartCard>
        </Animated.View>

      </ScrollView>

      {/* --- LOG WEIGHT MODAL --- */}
      <Modal visible={weightModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ backgroundColor: colors.card, width: "100%", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary, marginBottom: 8 }}>Log Weight</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>Enter your current body weight in kg.</Text>
                
                <TextInput
                    style={{ backgroundColor: colors.surface, borderRadius: 16, height: 60, paddingHorizontal: 20, color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginBottom: 24, borderWidth: 1, borderColor: colors.border }}
                    keyboardType="numeric"
                    placeholder="70.5"
                    placeholderTextColor={colors.textSecondary}
                    value={newWeight}
                    onChangeText={setNewWeight}
                    autoFocus
                />
                
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable onPress={() => setWeightModalVisible(false)} style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: "center", backgroundColor: colors.surface }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleLogWeight} style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: "center", backgroundColor: colors.primary }}>
                        <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                    </Pressable>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= UI COMPONENTS ================= */

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Card style={{ marginBottom: 20, padding: 20 }}>
      <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 }}>{title}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{subtitle}</Text>
      </View>
      {children}
    </Card>
  );
}

function WeightLineChart({ data, color }: { data: WeightEntry[]; color: string }) {
  const { colors } = useTheme();
  const height = 140;
  const padding = 20;
  const chartWidth = Dimensions.get("window").width - 32 - 40; // Screen - PagePadding - CardPadding

  if (data.length < 2) {
    return (
      <View style={{ height, justifyContent: "center", alignItems: "center", backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}>
        <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 13 }}>Log at least 2 entries to see your graph.</Text>
      </View>
    );
  }

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1; 

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = height - ((d.weight - minW) / range) * height;
    return { x, y, weight: d.weight };
  });

  const path = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  // Smooth area underneath
  const areaPath = `${path} L ${chartWidth} ${height} L 0 ${height} Z`;

  return (
    <View style={{ height: height + padding, width: "100%", marginTop: 10 }}>
      <Svg height={height} width={chartWidth}>
        <Defs>
           <SvgLinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={color} stopOpacity="0.0" />
           </SvgLinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#gradient)" />
        <Path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="4" fill={colors.card} stroke={color} strokeWidth="2" />
        ))}
      </Svg>
      
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
            {data[0]?.date ? format(data[0].date.toDate(), "MMM d") : ""}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
            {data[data.length - 1]?.date ? format(data[data.length - 1].date.toDate(), "MMM d") : ""}
        </Text>
      </View>
    </View>
  );
}

function EnhancedBarChart({ data, color }: { data: number[]; color: string }) {
  const { colors } = useTheme();
  const max = Math.max(...data, 1000);
  const chartHeight = 160;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: chartHeight, gap: 8 }}>
      {data.map((val, i) => {
        const barHeight = (val / max) * (chartHeight - 30);
        return (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ height: chartHeight - 30, width: "100%", justifyContent: "flex-end", backgroundColor: colors.surface, borderRadius: 10, overflow: "hidden" }}>
                <Animated.View 
                    layout={Layout.springify()}
                    style={{ height: Math.max(barHeight, 5), width: "100%", backgroundColor: color, borderRadius: 10 }} 
                />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary, marginTop: 8 }}>
              {DAYS[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
