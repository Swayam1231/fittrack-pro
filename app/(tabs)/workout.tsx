import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FirestoreService, Workout } from "../../src/services/firestore.service";
import { Loading } from "../../src/components/Loading";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

const { width } = Dimensions.get("window");

export default function Training() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;
  const { colors, gradients } = useTheme();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Workout[]>([]);

  useEffect(() => {
    if (!uid) return;
    return FirestoreService.subscribeToWorkoutHistory(uid, (all) => {
      setHistory(all.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
      setLoading(false);
    });
  }, [uid]);

  const weeklyVolume = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now);
    const end = endOfWeek(now);
    return history.reduce((sum, w) => {
      const date = w.createdAt?.toDate();
      if (date && isWithinInterval(date, { start, end })) {
        return sum + (w.totalVolume || 0);
      }
      return sum;
    }, 0);
  }, [history]);

  const targetVolume = 12000;
  const volumeProgress = Math.min(weeklyVolume / targetVolume, 1);

  if (loading) return <Loading label="Retrieving Protocols..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* --- TOP APP BAR --- */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.brand, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>PulseMetrics</Text>
        <Pressable onPress={() => router.push("../profile")} style={styles.avatarBtn}>
           <Image 
             source={{ uri: user?.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqpISx7NHE8_WIfVQ8mdvZWx7hBsvUTHzic8Y300iJpFqLBpXFsHUOtz_XogUE5mTrosJ3cKauc1yPr4xpdupwDBUL8BqqbwwKFR08vqK1Agi5aKOjy4DkLinV_WEe5Dq-HifWU7KwKIsgSFNU6wLrx8u8NSCc6oCIhDewxgXTaFw73I2Qxe7kB0kgDKO9LVMq3Ngs9HuZr-GYfJbNu_fII2Us0W5NG3lFqHDqmQa4_iGrV8rlV7Lr_bf9kMLp7j00iHifbZmAiRI' }} 
             style={styles.avatar} 
           />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* --- HERO SECTION --- */}
        <View style={styles.hero}>
           <View style={styles.heroContent}>
              <Text style={[styles.heroLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>TODAY'S FOCUS</Text>
              <Text style={[styles.heroTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>
                Upper Body{"\n"}
                <Text style={{ color: colors.textSecondary }}>Power</Text>
              </Text>
              <View style={[styles.heroBadge, { backgroundColor: colors.surfaceContainerLow }]}>
                 <Ionicons name="timer-outline" size={14} color={colors.textPrimary} />
                 <Text style={[styles.heroBadgeText, { color: colors.textPrimary, fontFamily: 'Manrope-SemiBold' }]}>45 Min</Text>
                 <View style={styles.dot} />
                 <Ionicons name="flame-outline" size={14} color={colors.textPrimary} />
                 <Text style={[styles.heroBadgeText, { color: colors.textPrimary, fontFamily: 'Manrope-SemiBold' }]}>High Intensity</Text>
              </View>
           </View>

           <Pressable onPress={() => router.push("/add-workout")} style={styles.startBtn}>
              <LinearGradient colors={gradients.primary} style={styles.startBtnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                 <Ionicons name="play" size={24} color="#fff" />
                 <Text style={[styles.startBtnText, { fontFamily: 'Manrope-Bold' }]}>Start Session</Text>
              </LinearGradient>
           </Pressable>
        </View>

        {/* --- BENTO GRID --- */}
        <View style={styles.grid}>
           <View style={[styles.volumeCard, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.cardHeader}>
                 <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Weekly Volume</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary, fontFamily: 'Manrope-SemiBold' }]}>Target: {targetVolume.toLocaleString()} kg</Text>
                 </View>
                 <View style={[styles.onTrackBadge, { backgroundColor: colors.success }]}>
                    <Text style={[styles.onTrackText, { fontFamily: 'Manrope-Bold' }]}>ON TRACK</Text>
                 </View>
              </View>
              <View style={styles.volumeValRow}>
                 <Text style={[styles.volumeVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{weeklyVolume.toLocaleString()}</Text>
                 <Text style={[styles.volumeUnit, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>kg lifted</Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.surfaceContainerHighest }]}>
                 <LinearGradient colors={gradients.primary} style={[styles.fill, { width: `${volumeProgress * 100}%` }]} start={{x:0, y:0}} end={{x:1, y:0}} />
              </View>
           </View>

           <View style={[styles.programCard, { backgroundColor: colors.surfaceContainerHighest }]}>
              <View style={styles.programTop}>
                 <View style={styles.programIconRow}>
                    <Ionicons name="construct-outline" size={18} color={colors.primary} />
                    <Text style={[styles.programLabel, { color: colors.primary, fontFamily: 'Manrope-Bold' }]}>ACTIVE PROGRAM</Text>
                 </View>
                 <Text style={[styles.programName, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Hypertrophy Phase 2</Text>
                 <Text style={[styles.programWeek, { color: colors.textSecondary, fontFamily: 'Manrope-SemiBold' }]}>Week 3 of 8</Text>
              </View>
              <Pressable>
                 <Text style={[styles.viewDetails, { color: colors.primary, fontFamily: 'Manrope-Bold' }]}>View Details</Text>
              </Pressable>
           </View>
        </View>

        {/* --- HISTORY --- */}
        <View style={styles.historySection}>
           <Text style={[styles.historyTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Recent History</Text>
           <View style={styles.historyList}>
              {history.length === 0 ? (
                 <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>No training metrics detected.</Text>
              ) : (
                 history.slice(0, 5).map((workout, index) => (
                    <HistoryItem key={workout.id} workout={workout} index={index} />
                 ))
              )}
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoryItem({ workout, index }: any) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(100 * index)} style={[styles.historyItem, { backgroundColor: colors.surfaceContainerLowest }]}>
       <View style={styles.historyLeft}>
          <View style={[styles.historyIcon, { backgroundColor: colors.surfaceContainerLow }]}>
             <Ionicons name={workout.type === 'Weightlifting' ? "fitness" : "walk"} size={20} color={colors.primary} />
          </View>
          <View>
             <Text style={[styles.historyName, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{workout.name || 'Strength Protocol'}</Text>
             <Text style={[styles.historyDate, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>
                {workout.createdAt ? format(workout.createdAt.toDate(), 'MMM dd') : 'Today'} • {workout.duration || 0} min
             </Text>
          </View>
       </View>
       <View style={styles.historyRight}>
          <View style={[styles.statBadge, { backgroundColor: colors.surfaceContainerLow }]}>
             <Text style={[styles.statBadgeText, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>{(workout.totalVolume || 0).toLocaleString()} kg</Text>
          </View>
       </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16,
    zIndex: 100,
  },
  menuBtn: { padding: 4 },
  brand: { fontSize: 20, letterSpacing: -1 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  scroll: { paddingBottom: 100 },
  hero: { padding: 24, paddingBottom: 40 },
  heroContent: { marginBottom: 32 },
  heroLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  heroTitle: { fontSize: 48, lineHeight: 54, letterSpacing: -2 },
  heroBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: 24,
    gap: 8,
  },
  heroBadgeText: { fontSize: 13 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.1)' },
  startBtn: { height: 64, borderRadius: 32, overflow: 'hidden' },
  startBtnGradient: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 12,
  },
  startBtnText: { color: '#fff', fontSize: 18 },
  grid: { paddingHorizontal: 24, gap: 16 },
  volumeCard: { borderRadius: 32, padding: 32 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  cardTitle: { fontSize: 24, letterSpacing: -0.5 },
  cardSub: { fontSize: 14, marginTop: 4 },
  onTrackBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  onTrackText: { color: '#fff', fontSize: 10 },
  volumeValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 },
  volumeVal: { fontSize: 56, letterSpacing: -2 },
  volumeUnit: { fontSize: 14 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)' },
  fill: { height: '100%', borderRadius: 4 },
  programCard: { borderRadius: 32, padding: 32, minHeight: 180, justifyContent: 'space-between' },
  programIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  programLabel: { fontSize: 11, letterSpacing: 1 },
  programName: { fontSize: 22, letterSpacing: -0.5 },
  programWeek: { fontSize: 14, marginTop: 4 },
  viewDetails: { fontSize: 14 },
  historySection: { marginTop: 48, paddingHorizontal: 24 },
  historyTitle: { fontSize: 20, marginBottom: 24 },
  historyList: { gap: 12 },
  historyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  historyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  historyName: { fontSize: 16, letterSpacing: -0.3 },
  historyDate: { fontSize: 12, marginTop: 2 },
  historyRight: {},
  statBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statBadgeText: { fontSize: 11 },
  emptyText: { textAlign: 'center', marginTop: 32 },
});
