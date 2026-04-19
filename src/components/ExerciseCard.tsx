import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Card } from "./Card";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

type SetEntry = { reps: string; weight: string; completed?: boolean };
type Exercise = { name: string; sets: SetEntry[]; target?: string };

export function ExerciseCard({
  exercise,
  index,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
  onUpdateSet,
  onToggleComplete,
}: {
  exercise: Exercise;
  index: number;
  onAddSet: () => void;
  onDeleteSet: (setIndex: number) => void;
  onDeleteExercise: () => void;
  onUpdateSet: (
    setIndex: number,
    field: "reps" | "weight",
    value: string
  ) => void;
  onToggleComplete?: (setIndex: number) => void;
}) {
  const { colors, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      {/* --- EXERCISE TOP HEADER --- */}
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>
            {exercise.name || "Select movement"}
          </Text>
          <Text style={[styles.targetInfo, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>
            {exercise.target || "TARGET: 3 SETS • 10-12 REPS"}
          </Text>
        </View>

        <Pressable
          onPress={onDeleteExercise}
          style={[styles.moreBtn, { backgroundColor: colors.surfaceContainerHighest }]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* --- COLUMN HEADERS --- */}
      <View style={styles.columnHeaders}>
        <Text style={[styles.colLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>SET</Text>
        <Text style={[styles.colLabel, { flex: 1.2, textAlign: 'center', color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>KG</Text>
        <Text style={[styles.colLabel, { flex: 1, textAlign: 'center', color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>REPS</Text>
        <Text style={[styles.colLabel, { width: 44, textAlign: 'right', color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>DONE</Text>
      </View>

      {/* --- SET ROWS --- */}
      {exercise.sets.map((set, sIdx) => {
        const isCompleted = set.completed;
        return (
          <View 
            key={sIdx} 
            style={[
              styles.setRow, 
              { 
                backgroundColor: isCompleted ? (theme === 'light' ? '#E8F5E9' : 'rgba(76, 175, 80, 0.1)') : colors.surfaceContainerLowest,
              }
            ]}
          >
            {/* Set Number */}
            <View style={[styles.setNumBox, { borderLeftColor: isCompleted ? '#4CAF50' : colors.primary }]}>
               <Text style={[styles.setNum, { color: isCompleted ? '#4CAF50' : colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{sIdx + 1}</Text>
            </View>

            {/* Weight Input */}
            <TextInput
              placeholder="0"
              keyboardType="numeric"
              value={set.weight}
              onChangeText={(v) => onUpdateSet(sIdx, "weight", v)}
              style={[styles.setInput, { color: colors.textPrimary, backgroundColor: colors.surfaceContainerLow, fontFamily: 'SpaceGrotesk-Medium' }]}
              placeholderTextColor={colors.onSurfaceVariant}
            />

            {/* Reps Input */}
            <TextInput
              placeholder="0"
              keyboardType="numeric"
              value={set.reps}
              onChangeText={(v) => onUpdateSet(sIdx, "reps", v)}
              style={[styles.setInput, { color: colors.textPrimary, backgroundColor: colors.surfaceContainerLow, fontFamily: 'SpaceGrotesk-Medium' }]}
              placeholderTextColor={colors.onSurfaceVariant}
            />

            {/* Completed Toggle */}
            <Pressable 
              onPress={() => onToggleComplete?.(sIdx)}
              style={[
                styles.doneCircle, 
                { backgroundColor: isCompleted ? '#4CAF50' : colors.surfaceContainerLow }
              ]}
            >
              {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
            </Pressable>
          </View>
        );
      })}

      <Pressable onPress={onAddSet} style={styles.addSetBtn}>
        <Text style={[styles.addSetText, { color: colors.primary, fontFamily: 'Manrope-Bold' }]}>
          + ADD SET
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 32,
    marginTop: 16,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  exerciseTitle: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  targetInfo: {
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  colLabel: {
    fontSize: 9,
    letterSpacing: 1,
    width: 32,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  setNumBox: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 3,
    height: 30,
  },
  setNum: {
    fontSize: 18,
  },
  setInput: {
    flex: 1,
    height: 48,
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 4,
    borderRadius: 12,
  },
  doneCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addSetBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  addSetText: {
    fontSize: 13,
    letterSpacing: 1,
  },
});
