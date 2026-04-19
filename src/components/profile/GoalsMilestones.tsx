import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  currentWeight: number;
  targetWeight: number | null;
  goalStartWeight: number | null;
  unit: string;
};

export default function GoalsMilestones({
  currentWeight,
  targetWeight,
  goalStartWeight,
  unit,
}: Props) {
  const router = useRouter();
  const { colors, gradients } = useTheme();

  if (!targetWeight || typeof goalStartWeight !== "number") {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceContainerLow }]}>
         <Text style={[styles.emptyText, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Medium' }]}>
           Initialize target parameters to begin operative tracking.
         </Text>
      </View>
    );
  }

  const startWeight = goalStartWeight;
  const isFatLoss = targetWeight < startWeight;
  const progressDelta = isFatLoss ? (startWeight - currentWeight) : (currentWeight - startWeight);
  const totalDelta = Math.abs(startWeight - targetWeight);
  const progressPercent = Math.max(0, Math.min((progressDelta / totalDelta) * 100, 100));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>GOALS & MILESTONES</Text>
        <Pressable onPress={() => router.push("/edit-goal-weight")}>
           <Text style={[styles.editLink, { color: colors.primary, fontFamily: 'Manrope-Bold' }]}>EDIT</Text>
        </Pressable>
      </View>

      <View style={[styles.targetCard, { backgroundColor: colors.surfaceContainerLowest }]}>
         <Text style={[styles.targetLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>TARGET WEIGHT</Text>
         <View style={styles.targetRow}>
            <Text style={[styles.targetValue, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{targetWeight}</Text>
            <Text style={[styles.targetUnit, { color: colors.primary, fontFamily: 'SpaceGrotesk-Bold' }]}>{unit}</Text>
         </View>

         <View style={styles.statsTimeline}>
            <StatColumn label="START" value={startWeight} unit={unit} />
            <View style={[styles.divider, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
            <StatColumn label="CURRENT" value={currentWeight} unit={unit} isNew />
         </View>

         <View style={[styles.track, { backgroundColor: colors.surfaceContainerHighest }]}>
            <LinearGradient 
               colors={gradients.primary} 
               start={{x:0, y:0}} 
               end={{x:1, y:0}} 
               style={[styles.fill, { width: `${progressPercent}%` }]} 
            />
         </View>
      </View>

      <View style={styles.milestoneGrid}>
         <TimelineMarker percent={25} achieved={progressPercent >= 25} />
         <TimelineMarker percent={50} achieved={progressPercent >= 50} />
         <TimelineMarker percent={75} achieved={progressPercent >= 75} />
         <TimelineMarker percent={100} achieved={progressPercent >= 100} label="GOAL" />
      </View>
    </View>
  );
}

function StatColumn({ label, value, unit, isNew }: any) {
  const { colors } = useTheme();
  return (
    <View style={styles.statCol}>
       <Text style={[styles.statLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>{label}</Text>
       <View style={styles.statValRow}>
          <Text style={[styles.statVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{value}</Text>
          <Text style={[styles.statUnit, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Bold' }]}>{unit}</Text>
       </View>
    </View>
  );
}

function TimelineMarker({ percent, achieved, label }: any) {
  const { colors, gradients } = useTheme();
  return (
    <View style={[styles.marker, { backgroundColor: achieved ? colors.surfaceContainerHighest : colors.surfaceContainerLow }]}>
       <Text style={[styles.markerText, { color: achieved ? colors.primary : colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk-Bold' }]}>
          {label || `${percent}%`}
       </Text>
       {achieved && <Ionicons name="checkmark" size={10} color={colors.primary} style={{ marginLeft: 4 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 11, letterSpacing: 1.5 },
  editLink: { fontSize: 11 },
  targetCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
  targetLabel: { fontSize: 9, letterSpacing: 1 },
  targetRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8, marginBottom: 24 },
  targetValue: { fontSize: 48, letterSpacing: -1 },
  targetUnit: { fontSize: 18, marginLeft: 4 },
  statsTimeline: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statCol: { flex: 1 },
  divider: { width: 1, height: 30, marginHorizontal: 20 },
  statLabel: { fontSize: 9, letterSpacing: 0.5, marginBottom: 4 },
  statValRow: { flexDirection: 'row', alignItems: 'baseline' },
  statVal: { fontSize: 20 },
  statUnit: { fontSize: 11, marginLeft: 2, opacity: 0.6 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  milestoneGrid: { flexDirection: 'row', gap: 8 },
  marker: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  markerText: { fontSize: 11 },
  emptyContainer: { padding: 32, borderRadius: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center', opacity: 0.6 },
});
