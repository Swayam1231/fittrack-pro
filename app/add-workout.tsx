import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { auth, db } from "../src/firebase/firebase";
import {
  addDoc,
  collection,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { Card } from "../src/components/Card";

/* ------------------ TYPES ------------------ */

type SetEntry = {
  reps: string;
  weight: string;
};

type Exercise = {
  name: string;
  sets: SetEntry[];
};

const MET = 6;

/* ------------------ COMPONENT ------------------ */

export default function AddWorkout() {
  const router = useRouter();
  const user = auth.currentUser;

  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState("");
  const [userWeight, setUserWeight] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        setUserWeight(Number(snap.data().weight || 0));
      }
    });
  }, [user]);

  if (!user) return null;

  /* ------------------ HELPERS ------------------ */

  const caloriesBurned =
    userWeight && duration
      ? Math.round(MET * userWeight * (Number(duration) / 60))
      : 0;

  /* ------------------ ACTIONS ------------------ */

  const addExercise = () => {
    setExercises((p) => [
      ...p,
      { name: "", sets: [{ reps: "", weight: "" }] },
    ]);
  };

  const updateExerciseName = (i: number, v: string) => {
    setExercises((p) =>
      p.map((ex, idx) => (idx === i ? { ...ex, name: v } : ex))
    );
  };

  const addSet = (exIndex: number) => {
    setExercises((p) =>
      p.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: [...ex.sets, { reps: "", weight: "" }] }
          : ex
      )
    );
  };

  const updateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof SetEntry,
    value: string
  ) => {
    setExercises((p) =>
      p.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIndex ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    setExercises((p) =>
      p.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
          : ex
      )
    );
  };

  /* ------------------ SAVE (FIXED) ------------------ */

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert("Missing workout name");
      return;
    }

    if (!duration || Number(duration) <= 0) {
      Alert.alert("Enter valid duration");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Add at least one exercise");
      return;
    }

    for (const ex of exercises) {
      if (!ex.name.trim()) {
        Alert.alert("Exercise name cannot be empty");
        return;
      }

      for (const s of ex.sets) {
        if (
          !s.reps ||
          !s.weight ||
          Number(s.reps) <= 0 ||
          Number(s.weight) <= 0
        ) {
          Alert.alert("All sets must have reps and weight");
          return;
        }
      }
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "users", user.uid, "workouts"), {
        name: workoutName.trim(),
        duration: Number(duration),
        caloriesBurned,
        createdAt: Timestamp.now(),
        exercises: exercises.map((ex) => ({
          name: ex.name.trim(),
          sets: ex.sets.map((s) => ({
            reps: Number(s.reps),
            weight: Number(s.weight),
          })),
        })),
      });

      router.back();
    } catch (err) {
      console.error("SAVE WORKOUT FAILED:", err);
      Alert.alert("Failed to save workout");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
      <Text style={styles.title}>Add Workout</Text>

      <Card>
        <Text style={styles.label}>Workout Name</Text>
        <TextInput value={workoutName} onChangeText={setWorkoutName} />

        <Text style={[styles.label, { marginTop: 12 }]}>
          Duration (minutes)
        </Text>
        <TextInput
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />

        {caloriesBurned > 0 && (
          <Text style={styles.burned}>
            🔥 Estimated Burn: {caloriesBurned} kcal
          </Text>
        )}
      </Card>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.section}>Exercises</Text>

        {exercises.map((ex, exIndex) => (
          <Card key={exIndex} style={{ marginBottom: 16 }}>
            <TextInput
              placeholder="Exercise name"
              value={ex.name}
              onChangeText={(v) =>
                updateExerciseName(exIndex, v)
              }
            />

            {ex.sets.map((s, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <TextInput
                  placeholder="Reps"
                  keyboardType="numeric"
                  value={s.reps}
                  onChangeText={(v) =>
                    updateSet(exIndex, setIndex, "reps", v)
                  }
                  style={styles.smallInput}
                />
                <TextInput
                  placeholder="Weight (kg)"
                  keyboardType="numeric"
                  value={s.weight}
                  onChangeText={(v) =>
                    updateSet(exIndex, setIndex, "weight", v)
                  }
                  style={styles.smallInput}
                />
                {ex.sets.length > 1 && (
                  <Pressable
                    onPress={() => removeSet(exIndex, setIndex)}
                  >
                    <Text style={styles.delete}>✕</Text>
                  </Pressable>
                )}
              </View>
            ))}

            <Pressable
              onPress={() => addSet(exIndex)}
              style={styles.addSet}
            >
              <Text style={styles.addSetText}>＋ Add Set</Text>
            </Pressable>
          </Card>
        ))}

        <Pressable onPress={addExercise} style={styles.addExercise}>
          <Text style={styles.addExerciseText}>＋ Add Exercise</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={saveWorkout}
        disabled={saving}
        style={styles.saveButton}
      >
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save Workout"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/* ------------------ STYLES ------------------ */

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  section: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  label: { fontSize: 12, color: "#6B7280" },
  burned: { marginTop: 8, fontWeight: "600", color: "#DC2626" },
  setRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  smallInput: { flex: 1 },
  delete: { color: "#DC2626" },
  addSet: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    alignItems: "center",
  },
  addSetText: { color: "#2563EB", fontWeight: "600" },
  addExercise: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    alignItems: "center",
  },
  addExerciseText: { color: "#1D4ED8", fontWeight: "600" },
  saveButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "600" },
});
