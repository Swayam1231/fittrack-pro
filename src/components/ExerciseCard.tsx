import { View, Text, TextInput, Pressable } from "react-native";
import { Card } from "./Card";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext"; // ✅ added

type SetEntry = { reps: string; weight: string };
type Exercise = { name: string; sets: SetEntry[] };

export function ExerciseCard({
  exercise,
  index,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
  onUpdateSet,
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
}) {
  const { colors } = useTheme(); // ✅ added

  return (
    <Card style={{ marginTop: 12 }}>
      <View style={styles.exerciseHeader}>
        <Text
          style={[
            styles.exerciseTitle,
            { color: colors.textPrimary }, // ✅
          ]}
        >
          {exercise.name || "Select exercise"}
        </Text>

        <Pressable onPress={onDeleteExercise}>
          <Text
            style={[
              styles.deleteText,
              { color: colors.danger }, // ✅
            ]}
          >
            Delete
          </Text>
        </Pressable>
      </View>

      {exercise.sets.map((set, sIdx) => (
        <View key={sIdx} style={styles.setRow}>
          <TextInput
            placeholder="Reps"
            keyboardType="numeric"
            value={set.reps}
            onChangeText={(v) => onUpdateSet(sIdx, "reps", v)}
            style={[
              styles.setInput,
              {
                backgroundColor: colors.background, // ✅
                color: colors.textPrimary, // ✅
              },
            ]}
            placeholderTextColor={colors.textSecondary} // ✅
          />

          <TextInput
            placeholder="Weight"
            keyboardType="numeric"
            value={set.weight}
            onChangeText={(v) => onUpdateSet(sIdx, "weight", v)}
            style={[
              styles.setInput,
              {
                backgroundColor: colors.background, // ✅
                color: colors.textPrimary, // ✅
              },
            ]}
            placeholderTextColor={colors.textSecondary} // ✅
          />

          <Pressable onPress={() => onDeleteSet(sIdx)}>
            <Text
              style={[
                styles.deleteSet,
                { color: colors.danger }, // ✅
              ]}
            >
              ✕
            </Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={onAddSet}>
        <Text
          style={{
            color: colors.accent, // ✅
            marginTop: 6,
          }}
        >
          + Add Set
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  exerciseTitle: {
    fontWeight: "600",
    fontSize: 15,
  },
  deleteText: {
    fontWeight: "600",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  setInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
  },
  deleteSet: {
    fontSize: 18,
    paddingHorizontal: 6,
  },
});
