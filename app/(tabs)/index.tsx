import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, StyleSheet, Dimensions, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, withRepeat, withTiming, useSharedValue } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Pedometer } from "expo-sensors";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { FirestoreService } from "../../src/services/firestore.service";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, gradients } = useTheme();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState(0);
  const [meals, setMeals] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubUser = FirestoreService.subscribeToProfile(user.uid, setProfile);
    const unsubMeals = FirestoreService.subscribeToTodayMeals(user.uid, (data) => {
      setMeals(data);
      setLoading(false);
    });
    const unsubWorkouts = FirestoreService.subscribeToTodayWorkouts(user.uid, setWorkouts);
    const unsubWater = FirestoreService.subscribeToTodayWater(user.uid, setWater);
    const unsubSteps = FirestoreService.subscribeToTodaySteps(user.uid, setSteps);

    let pedometerSub: any;
    Pedometer.isAvailableAsync().then(result => {
      if (result) {
        pedometerSub = Pedometer.watchStepCount(result => {
           setSteps(prev => prev + result.steps);
        });
      }
    });

    return () => {
      unsubUser(); unsubMeals(); unsubWorkouts(); unsubWater(); unsubSteps();
      if (pedometerSub) pedometerSub.remove();
    };
  }, [user]);

  const consumedCalories = useMemo(() => meals.reduce((s, m) => s + (m.calories || 0), 0), [meals]);
  const targetCalories = profile?.targets?.calories || 2000;
  const calorieProgress = Math.min((consumedCalories / targetCalories), 1);

  if (loading) return (
     <View style={[styles.loading, { backgroundColor: colors.background }]}>
       <Text style={[styles.loadingText, { color: colors.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>KINETIC SYNC...</Text>
     </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* --- TOP APP BAR --- */}
      <View style={[styles.header, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
        <Pressable style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.brand, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>PulseMetrics</Text>
        <Pressable onPress={() => router.push("../profile")} style={styles.avatarBtn}>
           <Image 
             source={{ uri: user?.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4QfvQ1EsaH0pgyBx_nUdo6jyIbC_s5H2hq6BRvFKZ-7g5fLn9KALblsLr2CNnkhPIRmaFl88UXqGh28Uf11VQtHkI6ZzB7Dt6f340FX5LDNXg_ZlN7RixjYmwk-BYzbx2VcHeL2wtLBH3MCsb0612OCn3saFG1Hhumqvs_Hc1yeLsZ56piyXhspMEOIl3pdLSH1nccPefpNLRoaEIvLTQTkCV-81KIssVZNuDXFz77s26LLEIPs2p7IFDKXPENnLa6EgFQaMw4_Q' }} 
             style={styles.avatar} 
           />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
           <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Overview</Text>
           <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>Your clinical metrics for today.</Text>
        </View>

        {/* --- BENTO GRID --- */}
        <View style={styles.grid}>
           {/* Calorie Ring (Hero Card) - Spans 2 full columns */}
           <Animated.View entering={FadeInUp.delay(200)} style={styles.heroWrapper}>
              <View style={[styles.heroCard, { backgroundColor: colors.surfaceContainerLowest }]}>
                 <LinearGradient colors={['rgba(70,72,212,0.05)', 'rgba(129,39,207,0.05)']} style={StyleSheet.absoluteFill} />
                 <CircularProgress progress={calorieProgress} total={consumedCalories} colors={gradients.primary} />
                 <Text style={[styles.heroTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Active Calories</Text>
                 <Text style={[styles.heroCaption, { color: colors.textSecondary, fontFamily: 'Manrope-SemiBold' }]}>{Math.round(calorieProgress * 100)}% of daily goal</Text>
              </View>
           </Animated.View>

           {/* Steps Card */}
           <BentoCard 
              entering={FadeInDown.delay(300)}
              icon="walk"
              iconColor={colors.success}
              iconBg="rgba(0,136,93,0.1)"
              value={steps.toLocaleString()}
              label="Steps Today"
              trend="+12%"
              trendColor={colors.success}
           />

           {/* Heart Rate */}
           <BentoCard 
              entering={FadeInDown.delay(400)}
              icon="heart"
              iconColor={colors.danger}
              iconBg="rgba(186,26,26,0.1)"
              value="72"
              unit="bpm"
              label="Resting avg"
           />

           {/* Hydration */}
           <View style={[styles.bentoHalf, styles.hydrationCard, { backgroundColor: colors.surfaceContainerLowest }]}>
              <View style={styles.waterFill} />
              <View style={styles.bentoHeader}>
                 <Ionicons name="water" size={18} color={colors.primary} />
                 <Text style={[styles.bentoLabel, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>HYDRATION</Text>
              </View>
              <View style={styles.bentoValueRow}>
                 <Text style={[styles.bentoValue, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{water.toFixed(1)}</Text>
                 <Text style={[styles.bentoUnit, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>/ 2.5L</Text>
              </View>
           </View>

           {/* Sleep */}
           <View style={[styles.bentoHalf, { backgroundColor: colors.surfaceContainerLow, padding: 16 }]}>
              <View style={styles.bentoHeader}>
                 <Ionicons name="moon" size={18} color={colors.secondary} />
                 <Text style={[styles.bentoLabel, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>SLEEP</Text>
              </View>
              <Text style={[styles.bentoValue, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold', marginVertical: 8 }]}>6h 45m</Text>
              <View style={[styles.miniTrack, { backgroundColor: colors.surfaceContainerHighest }]}>
                 <View style={[styles.miniFill, { backgroundColor: colors.secondary, width: '70%' }]} />
              </View>
           </View>
        </View>

        {/* --- QUICK ACTIONS --- */}
        <View style={styles.quickSection}>
           <Text style={[styles.quickTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Quick Log</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
              <QuickPill icon="water-outline" label="Water" color={colors.primary} onPress={() => user && FirestoreService.logWater(user.uid, 0.25)} />
              <QuickPill icon="fitness-outline" label="Workout" color={colors.secondary} onPress={() => router.push("/add-workout")} />
              <QuickPill icon="restaurant-outline" label="Add Meal" color={colors.success} onPress={() => router.push("/add-meal")} />
           </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BentoCard({ entering, icon, iconColor, iconBg, value, unit, label, trend, trendColor }: any) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={entering} style={[styles.bentoHalf, { backgroundColor: colors.surfaceContainerLow }]}>
      <View style={styles.bentoTop}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
           <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        {trend && (
           <View style={[styles.trendBadge, { backgroundColor: `${trendColor}15` }]}>
              <Text style={[styles.trendText, { color: trendColor, fontFamily: 'Manrope-Bold' }]}>{trend}</Text>
           </View>
        )}
      </View>
      <View style={styles.bentoBottom}>
         <View style={styles.bentoValueRow}>
            <Text style={[styles.bentoValue, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{value}</Text>
            {unit && <Text style={[styles.bentoUnit, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>{unit}</Text>}
         </View>
         <Text style={[styles.miniLabel, { color: colors.textSecondary, fontFamily: 'Manrope-SemiBold' }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const CircularProgress = ({ progress, total, colors: gradientColors }: any) => {
  const { colors } = useTheme();
  return (
    <View style={styles.circleContainer}>
      <Svg width="180" height="180" viewBox="0 0 100 100">
        <Defs>
          <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} />
            <Stop offset="100%" stopColor={gradientColors[1]} />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="42" stroke={colors.surfaceContainerHighest} strokeWidth="10" fill="none" />
        <Circle 
          cx="50" cy="50" r="42" 
          stroke="url(#grad)" strokeWidth="10" 
          strokeDasharray="263.89" 
          strokeDashoffset={263.89 * (1 - progress)} 
          strokeLinecap="round" fill="none" 
          transform="rotate(-90 50 50)"
        />
      </Svg>
      <View style={styles.circleCenter}>
         <Ionicons name="flame" size={24} color={colors.primary} style={{ marginBottom: 4 }} />
         <Text style={[styles.circleVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{total}</Text>
      </View>
    </View>
  );
};

const QuickPill = ({ icon, label, color, onPress }: any) => {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: colors.surfaceContainerLow }]}>
       <View style={[styles.pillIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={18} color={color} />
       </View>
       <Text style={[styles.pillLabel, { color: colors.textPrimary, fontFamily: 'Manrope-Bold' }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 14, letterSpacing: 4 },
  scroll: { paddingBottom: 100 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16,
    zIndex: 100,
  },
  menuBtn: { p: 4 },
  brand: { fontSize: 20, letterSpacing: -1 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  welcomeSection: { padding: 24, paddingTop: 32 },
  title: { fontSize: 36, letterSpacing: -1 },
  subtitle: { fontSize: 14, marginTop: 4 },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 16, 
    gap: 16 
  },
  heroWrapper: { width: '100%' },
  heroCard: { 
    borderRadius: 40, 
    padding: 32, 
    alignItems: 'center',
    overflow: 'hidden',
  },
  circleContainer: { alignItems: 'center', justifyContent: 'center' },
  circleCenter: { position: 'absolute', alignItems: 'center' },
  circleVal: { fontSize: 40, letterSpacing: -2 },
  heroTitle: { fontSize: 20, marginTop: 24 },
  heroCaption: { fontSize: 14, marginTop: 4, opacity: 0.7 },
  bentoHalf: { width: (width - 48) / 2, borderRadius: 24, padding: 20, justifyContent: 'space-between' },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bentoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trendBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendText: { fontSize: 10 },
  bentoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bentoValue: { fontSize: 28, letterSpacing: -1 },
  bentoUnit: { fontSize: 12, opacity: 0.6 },
  miniLabel: { fontSize: 12, marginTop: 4 },
  hydrationCard: { overflow: 'hidden' },
  waterFill: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: '40%', 
    backgroundColor: 'rgba(70,72,212,0.05)' 
  },
  bentoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bentoLabel: { fontSize: 9, letterSpacing: 1 },
  miniTrack: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 3 },
  quickSection: { marginTop: 40 },
  quickTitle: { fontSize: 18, marginLeft: 24, marginBottom: 16 },
  quickScroll: { paddingHorizontal: 24, gap: 12, paddingRight: 40 },
  pill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 12, 
    paddingRight: 20, 
    borderRadius: 100 
  },
  pillIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pillLabel: { fontSize: 14 },
});
