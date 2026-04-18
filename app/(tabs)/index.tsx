import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Pedometer } from "expo-sensors";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { FirestoreService } from "../../src/services/firestore.service";
import { Card } from "../../src/components/Card";

/* ------------------ HELPERS ------------------ */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/* ------------------ COMPONENT ------------------ */

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, gradients } = useTheme();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [targets, setTargets] = useState<any>(null);
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState(0);
  const [meals, setMeals] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);

  const today = startOfToday();

  /* ================= REAL-TIME DATA ================= */

  useEffect(() => {
    if (!user) return;

    const unsubUser = FirestoreService.subscribeToProfile(user.uid, (data) => {
      if (data) {
        setTargets(data.targets);
        setProfile(data);
      }
    });

    const unsubMeals = FirestoreService.subscribeToTodayMeals(user.uid, (data) => {
      setMeals(data);
      setLoading(false);
    });

    const unsubWorkouts = FirestoreService.subscribeToTodayWorkouts(user.uid, (data) => {
      setWorkouts(data);
    });

    const unsubWater = FirestoreService.subscribeToTodayWater(user.uid, (data) => {
      setWater(data);
    });

    const unsubSteps = FirestoreService.subscribeToTodaySteps(user.uid, (data) => {
      setSteps(data);
    });

    // --- Live Pedometer ---
    let pedometerSub: any;
    Pedometer.isAvailableAsync().then(result => {
      if (result) {
        pedometerSub = Pedometer.watchStepCount(result => {
           setSteps(prev => prev + result.steps);
        });
      }
    });

    return () => {
      unsubUser();
      unsubMeals();
      unsubWorkouts();
      unsubWater();
      unsubSteps();
      if (pedometerSub) pedometerSub.remove();
    };
  }, [user]);

  const syncGoogleFit = () => {
     if (!user) return;
     // Simulated Google Fit Logic
     const mockSteps = Math.floor(Math.random() * 5000) + 2000;
     FirestoreService.updateSteps(user.uid, mockSteps);
     alert("Synced " + mockSteps + " steps from Google Fit!");
  };

  /* ================= CALCULATIONS ================= */

  const consumedCalories = useMemo(
    () => meals.reduce((s, m) => s + (m.calories || 0), 0),
    [meals]
  );

  const burnedCalories = useMemo(
    () => workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
    [workouts]
  );

  const targetCalories = targets?.calories || 2000;
  const remainingCalories = Math.max(targetCalories - consumedCalories, 0);
  const calorieProgress = Math.min((consumedCalories / targetCalories) * 100, 100);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
         <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- HEADER ---------- */}
        <Animated.View 
          entering={FadeInUp.duration(600)}
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}
        >
          <View>
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "500" }}>
              {formatDate(new Date())}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>
                  Hey, {user?.displayName?.split(" ")[0] || "Athlete"}!
                </Text>
                {profile?.streak > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff5f5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#ffe3e3" }}>
                        <Ionicons name="flame" size={16} color="#ff4d4d" />
                        <Text style={{ color: "#ff4d4d", fontWeight: "800", fontSize: 12, marginLeft: 2 }}>{profile.streak}</Text>
                    </View>
                )}
            </View>
          </View>

          <Pressable onPress={() => router.push("../profile")}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}>
               <Ionicons name="person" size={20} color={colors.primary} />
            </View>
          </Pressable>
        </Animated.View>

        {/* ---------- DAILY SUMMARY GRADIENT CARD ---------- */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600", marginBottom: 4 }}>Calories Remaining</Text>
                <Text style={{ color: "#fff", fontSize: 42, fontWeight: "800" }}>{remainingCalories}</Text>
              </View>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="flame" size={32} color="#fff" />
              </View>
            </View>

            <View style={{ height: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
              <Animated.View style={{ height: "100%", width: `${calorieProgress}%`, backgroundColor: "#fff" }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Eaten: {consumedCalories} kcal</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Goal: {targetCalories} kcal</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ---------- STEPS TRACKER ---------- */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ marginBottom: 20 }}>
           <Card style={{ padding: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                 <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${colors.success}15`, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="footsteps" size={24} color={colors.success} />
                    </View>
                    <View>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 }}>{steps.toLocaleString()}</Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>Daily Steps</Text>
                    </View>
                 </View>
                 <Pressable 
                    onPress={syncGoogleFit}
                    style={{ backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 6 }}
                 >
                    <Ionicons name="sync" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>Sync</Text>
                 </Pressable>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "500" }}>Goal: 10,000 steps</Text>
                  <Text style={{ fontSize: 12, color: colors.success, fontWeight: "700" }}>{((steps/10000)*100).toFixed(0)}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
                  <View style={{ height: "100%", width: `${Math.min((steps/10000)*100, 100)}%`, backgroundColor: colors.success }} />
              </View>
           </Card>
        </Animated.View>

        {/* ---------- STATS GRID ---------- FROM LINE 169 ... */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ flex: 1 }}>
            <StatCard title="Activity" value={burnedCalories} unit="kcal" icon="fitness" color={colors.accent} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ flex: 1 }}>
            <StatCard title="Workouts" value={workouts.length} unit="sessions" icon="barbell" color={colors.success} />
          </Animated.View>
        </View>

        {/* ---------- WATER TRACKER ---------- */}
        <Animated.View entering={FadeInDown.delay(550).duration(600)} style={{ marginBottom: 20 }}>
           <Card style={{ padding: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                 <View>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 }}>Hydration</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>{water.toFixed(1)}L of 2.5L target</Text>
                 </View>
                 <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => user && FirestoreService.logWater(user.uid, -0.25)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}>
                       <Ionicons name="remove" size={20} color={colors.textPrimary} />
                    </Pressable>
                    <Pressable onPress={() => user && FirestoreService.logWater(user.uid, 0.25)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.accent}15`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.accent }}>
                       <Ionicons name="add" size={20} color={colors.accent} />
                    </Pressable>
                 </View>
              </View>
              
              <View style={{ height: 12, backgroundColor: colors.surface, borderRadius: 6, overflow: "hidden" }}>
                 <Animated.View style={{ height: "100%", width: `${Math.min((water / 2.5) * 100, 100)}%`, backgroundColor: colors.accent, borderRadius: 6 }} />
              </View>
           </Card>
        </Animated.View>

        {/* ---------- DAILY ACTION ---------- */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Card style={{ padding: 20, borderLeftWidth: 4, borderLeftColor: colors.primary }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="bulb" size={20} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 }}>Daily Insight</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                  You've reached {(calorieProgress).toFixed(0)}% of your calorie goal. Keep it up!
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* ---------- QUICK ACTIONS ---------- */}
        <View style={{ marginTop: 24 }}>
           <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 }}>Quick Actions</Text>
           <View style={{ flexDirection: "row", gap: 12 }}>
              <QuickAction icon="restaurant" label="Add Meal" color={colors.primary} onPress={() => router.push("/add-meal")} />
              <QuickAction icon="add-circle" label="Add Workout" color={colors.accent} onPress={() => router.push("/add-workout")} />
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------ SMALL COMPONENTS ------------------ */

function StatCard({ title, value, unit, icon, color }: { title: string; value: any; unit: string; icon: any; color: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ padding: 16, alignItems: "flex-start" }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${color}15`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
         <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: "800", color: colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>{title} ({unit})</Text>
    </Card>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
       <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 20, alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{label}</Text>
       </View>
    </Pressable>
  );
}
