import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useProgressMetrics } from "../../hooks/useProgressMetrics";

type Range = 7 | 30 | 90;

export default function ProgressOverview() {
  const { colors } = useTheme();
  const [range, setRange] = useState<Range>(7);

  const {
    weightChange,
    workoutConsistency,
    calorieAdherence,
    loading,
  } = useProgressMetrics(range);

  const RangeButton = ({ value }: { value: Range }) => {
    const selected = range === value;
    return (
      <Pressable
        onPress={() => setRange(value)}
        style={[styles.rangeBtn, { backgroundColor: selected ? colors.surfaceContainerHighest : 'transparent' }]}
      >
        <Text style={[styles.rangeText, { color: selected ? colors.primary : colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>
          {value}D
        </Text>
      </Pressable>
    );
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>RETROSPECTIVE</Text>
         <View style={[styles.rangeSelector, { backgroundColor: colors.surfaceContainerHighest }]}>
            <RangeButton value={7} />
            <RangeButton value={30} />
            <RangeButton value={90} />
         </View>
      </View>

      <View style={styles.metricGrid}>
         <MetricBox 
           label="Weight Change" 
           val={`${weightChange >= 0 ? "+" : ""}${weightChange.toFixed(1)}`} 
           unit="kg" 
         />
         <MetricBox 
           label="Consistency" 
           val={workoutConsistency} 
           unit="%" 
         />
         <MetricBox 
           label="Adherence" 
           val={calorieAdherence} 
           unit="%" 
         />
      </View>
    </View>
  );
}

function MetricBox({ label, val, unit }: any) {
  const { colors } = useTheme();
  return (
    <View style={[styles.metricBox, { backgroundColor: colors.surfaceContainerLowest }]}>
       <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>{label.toUpperCase()}</Text>
       <View style={styles.metricValRow}>
          <Text style={[styles.metricVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{val}</Text>
          <Text style={[styles.metricUnit, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Bold' }]}>{unit}</Text>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 11, letterSpacing: 1.5 },
  rangeSelector: { flexDirection: 'row', padding: 2, borderRadius: 12 },
  rangeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  rangeText: { fontSize: 10 },
  metricGrid: { flexDirection: 'row', gap: 8 },
  metricBox: { flex: 1, padding: 16, borderRadius: 20 },
  metricLabel: { fontSize: 8, letterSpacing: 0.5 },
  metricValRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  metricVal: { fontSize: 20 },
  metricUnit: { fontSize: 10, marginLeft: 2, opacity: 0.6 },
});
