import { View, Text, ScrollView, Dimensions, Pressable, TextInput, Modal, StyleSheet, Image } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FirestoreService, Workout, UserProfile, WeightEntry } from "../../src/services/firestore.service";
import { Loading } from "../../src/components/Loading";
import { MuscleHeatmap } from "../../src/components/MuscleHeatmap";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { format } from "date-fns";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function Performance() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;
  const { colors, gradients } = useTheme();

  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [timeframe, setTimeframe] = useState("1M");
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    if (!uid) return;
    const unsubProfile = FirestoreService.subscribeToProfile(uid, setProfile);
    const unsubWeight = FirestoreService.subscribeToWeightHistory(uid, setWeightHistory);
    const unsubWorkouts = FirestoreService.subscribeToWorkoutHistory(uid, setWorkouts);
    const unsubMetrics = FirestoreService.subscribeToRecentMetrics(uid, setMetrics);
    
    setLoading(false);
    return () => {
      unsubProfile(); unsubWeight(); unsubWorkouts(); unsubMetrics();
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

  if (loading) return <Loading label="Initializing Telemetry..." />;

  const currentWeight = weightHistory[weightHistory.length - 1]?.weight || profile?.weight || "--";

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
             source={user?.photoURL ? { uri: user.photoURL } : require("../../assets/images/default-avatar.png")} 
             style={styles.avatar} 
           />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
         <View style={styles.topSection}>
            <View style={styles.liveBadge}>
               <View style={[styles.pulseDot, { backgroundColor: colors.danger }]} />
               <Text style={[styles.liveText, { color: colors.danger, fontFamily: 'Manrope-Bold' }]}>LIVE SYNCED</Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Performance</Text>
         </View>

         {/* --- BODY COMPOSITION CARD --- */}
         <View style={styles.compositionSection}>
            <View style={[styles.compositionCard, { backgroundColor: colors.surfaceContainerLow }]}>
               <View style={styles.compHeader}>
                  <View>
                     <Text style={[styles.compLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>BODY COMPOSITION</Text>
                     <View style={styles.mainMetricRow}>
                        <Text style={[styles.mainMetricVal, { color: colors.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>14.2</Text>
                        <Text style={[styles.mainMetricUnit, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Bold' }]}>%</Text>
                        <Ionicons name="trending-down" size={24} color={colors.success} style={{ marginLeft: 8 }} />
                     </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.weightLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>TOTAL WEIGHT</Text>
                        <Pressable onPress={() => setWeightModalVisible(true)}>
                           <Ionicons name="add-circle" size={16} color={colors.primary} />
                        </Pressable>
                     </View>
                     <Text style={[styles.weightVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{currentWeight} lbs</Text>
                  </View>
               </View>

               <View style={styles.chartPad}>
                  <CompositionChart color={colors.primary} data={weightHistory} />
               </View>
            </View>
         </View>

         {/* --- HEATMAP --- */}
         <View style={styles.heatmapSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Muscle Analytics</Text>
            <View style={[styles.heatmapCard, { backgroundColor: colors.surfaceContainerLow }]}>
               <MuscleHeatmap workouts={workouts} />
            </View>
         </View>

         {/* --- BIOMETRICS --- */}
         <View style={styles.biometricsSection}>
            <BiometricTile label="RESTING HR" value={metrics.hr || "62"} unit="bpm" color={colors.danger} />
            <BiometricTile label="VO2 MAX" value={metrics.vo2 || "42.5"} unit="ml/kg" color={colors.success} />
            <BiometricTile label="SLEEP" value="82" unit="/100" color={colors.secondary} />
         </View>

         {/* --- RECENT ACTIVITY --- */}
         <View style={styles.activitySection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Activity Telemetry</Text>
            <View style={styles.activityList}>
               {workouts.slice(0, 3).map((w, i) => (
                  <ActivityTile key={w.id} workout={w} index={i} colors={colors} />
               ))}
            </View>
         </View>
      </ScrollView>

      {/* MODAL */}
      <Modal visible={weightModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Log weight</Text>
                <TextInput
                    style={[styles.weightInput, { backgroundColor: colors.surfaceContainerLow, color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}
                    keyboardType="numeric"
                    placeholder="00.0"
                    placeholderTextColor="rgba(0,0,0,0.2)"
                    value={newWeight}
                    onChangeText={setNewWeight}
                    autoFocus
                />
                <View style={styles.modalActions}>
                    <Pressable onPress={() => setWeightModalVisible(false)} style={[styles.modalBtn, { backgroundColor: colors.surfaceContainerLow }]}>
                        <Text style={[styles.modalBtnText, { color: colors.textPrimary, fontFamily: 'Manrope-Bold' }]}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleLogWeight} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.modalBtnText, { color: '#fff', fontFamily: 'Manrope-Bold' }]}>Log Entry</Text>
                    </Pressable>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BiometricTile({ label, value, unit, color }: any) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bioTile, { backgroundColor: colors.surfaceContainerLow }]}>
       <Text style={[styles.bioLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>{label}</Text>
       <View style={styles.bioValRow}>
          <Text style={[styles.bioVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{value}</Text>
          <Text style={[styles.bioUnit, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>{unit}</Text>
       </View>
       <View style={[styles.bioIndicator, { backgroundColor: color }]} />
    </View>
  );
}

function ActivityTile({ workout, colors, index }: any) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 100)} style={[styles.activityTile, { backgroundColor: colors.surfaceContainerLowest }]}>
       <View style={styles.activityLeft}>
          <View style={[styles.activityIcon, { backgroundColor: colors.surfaceContainerLow }]}>
             <Ionicons name={workout.type === 'Weightlifting' ? "barbell" : "walk"} size={20} color={colors.primary} />
          </View>
          <View>
             <Text style={[styles.activityName, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{workout.name || 'Strength Protocol'}</Text>
             <Text style={[styles.activityDate, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>{workout.createdAt ? format(workout.createdAt.toDate(), 'EEE • MMM d') : 'Today'}</Text>
          </View>
       </View>
       <View style={styles.activityRight}>
          <Text style={[styles.activityVol, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{(workout.totalVolume || 0).toLocaleString()}</Text>
          <Text style={[styles.activityVolUnit, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>KG</Text>
       </View>
    </Animated.View>
  );
}

const CompositionChart = ({ color, data }: { color: string, data: any[] }) => {
  const points = data.length > 5 ? data.slice(-10) : [70, 71, 70.5, 69.8, 69.2, 68.5, 68].map(w => ({ weight: w }));
  const max = Math.max(...points.map(p => p.weight)) + 1;
  const min = Math.min(...points.map(p => p.weight)) - 1;
  const range = max - min;
  const pathData = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 40 - ((p.weight - min) / range) * 30;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  return (
    <Svg height="100" width={width - 80} viewBox="0 0 100 40">
      <Defs>
        <SvgLinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      <Path d={`${pathData} L100,40 L0,40 Z`} fill="url(#glow)" />
      <Path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, zIndex: 100 },
  menuBtn: { padding: 4 },
  brand: { fontSize: 20, letterSpacing: -1 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  scroll: { paddingBottom: 100 },
  topSection: { padding: 24 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, letterSpacing: 1.5 },
  title: { fontSize: 40, letterSpacing: -1.5 },
  compositionSection: { paddingHorizontal: 24, marginBottom: 32 },
  compositionCard: { borderRadius: 32, padding: 24 },
  compHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  compLabel: { fontSize: 10, letterSpacing: 1 },
  mainMetricRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  mainMetricVal: { fontSize: 48, letterSpacing: -1 },
  mainMetricUnit: { fontSize: 24, marginLeft: 2 },
  weightLabel: { fontSize: 10, letterSpacing: 1 },
  weightVal: { fontSize: 24, textAlign: 'right', marginTop: 4 },
  chartPad: { marginTop: 24, alignItems: 'center' },
  heatmapSection: { paddingHorizontal: 24, marginBottom: 32 },
  sectionTitle: { fontSize: 20, marginBottom: 16 },
  heatmapCard: { borderRadius: 32, padding: 24 },
  biometricsSection: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 40 },
  bioTile: { flex: 1, borderRadius: 24, padding: 16, overflow: 'hidden' },
  bioLabel: { fontSize: 9, letterSpacing: 0.5 },
  bioValRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  bioVal: { fontSize: 20 },
  bioUnit: { fontSize: 10, marginLeft: 2, opacity: 0.6 },
  bioIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },
  activitySection: { paddingHorizontal: 24 },
  activityList: { gap: 12 },
  activityTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 24 },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  activityIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  activityName: { fontSize: 16 },
  activityDate: { fontSize: 12, marginTop: 2 },
  activityRight: { alignItems: 'flex-end' },
  activityVol: { fontSize: 18 },
  activityVolUnit: { fontSize: 9 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', padding: 32, borderRadius: 32 },
  modalTitle: { fontSize: 24, marginBottom: 24 },
  weightInput: { height: 80, borderRadius: 20, textAlign: 'center', fontSize: 32, marginBottom: 32 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, padding: 18, borderRadius: 20, alignItems: 'center' },
  modalBtnText: { fontSize: 15 },
});
