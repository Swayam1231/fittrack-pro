import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth, db } from "../src/firebase/firebase";
import {
  addDoc,
  collection,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";

import { Card } from "../src/components/Card";
import { useExerciseCatalog } from "../src/hooks/useExerciseCatalog";
import { ExerciseCard } from "../src/components/ExerciseCard";
import { ExercisePickerModal } from "../src/components/ExercisePickerModal";
import { useTheme } from "../src/context/ThemeContext";

/* ===================== TYPES ===================== */

type SetEntry = { reps: string; weight: string };
type Exercise = { name: string; sets: SetEntry[] };

type LastSetMap = {
  [exerciseName: string]: { reps: number; weight: number };
};

const LAST_SET_KEY = "exercise_last_sets";

/* ===================== HELPERS ===================== */

const normalize = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

/* ===================== SCREEN ===================== */

export default function AddWorkout() {
  const router = useRouter();
  const user = auth.currentUser;
  const { exercises: catalog } = useExerciseCatalog();
  const { colors } = useTheme();

  /* ---------- STATE ---------- */

  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState("");
  const [userWeight, setUserWeight] = useState(0);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState("");

  const [lastSets, setLastSets] = useState<LastSetMap>({});

  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  /* ---------- LOAD DATA ---------- */

  useEffect(() => {
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        setUserWeight(Number(snap.data().weight || 0));
      }
    });

    AsyncStorage.getItem(LAST_SET_KEY).then((d) => {
      if (d) setLastSets(JSON.parse(d));
    });
  }, [user]);

  /* ===================== CALORIES ===================== */

  const caloriesBurned = useMemo(() => {
  if (!user || !duration || userWeight <= 0) return 0;

  const durationMinutes = Number(duration);
  if (durationMinutes <= 0) return 0;

  // Base MET for strength training
  let met = 5.0;

  // Slightly scale MET based on workout density
  const totalSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0
  );

  if (totalSets >= 20) met = 6.0;
  else if (totalSets >= 12) met = 5.5;

  const calories =
    met * userWeight * (durationMinutes / 60);

  return Math.round(calories);
}, [user, duration, userWeight, exercises]);


  /* ===================== ACTIONS ===================== */

  const addExerciseWithMemory = (name: string) => {
    const remembered = lastSets[normalize(name)];
    setExercises((p) => [
      ...p,
      {
        name,
        sets: [
          {
            reps: remembered ? String(remembered.reps) : "",
            weight: remembered ? String(remembered.weight) : "",
          },
        ],
      },
    ]);
  };

  const saveWorkout = async () => {
    if (!user) return;

    if (!workoutName || !duration || exercises.length === 0) {
      return Alert.alert("Incomplete workout");
    }

    await addDoc(collection(db, "users", user.uid, "workouts"), {
      name: workoutName,
      duration: Number(duration),
      caloriesBurned,
      createdAt: Timestamp.now(),
      exercises,
    });

    router.back();
  };

  if (!user) return null;

  /* ===================== UI ===================== */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Add Workout
        </Text>

        {/* ---------- BASIC INFO ---------- */}
        <Card>
          <Text style={{ color: colors.textSecondary }}>
            Workout Name
          </Text>
          <TextInput
            value={workoutName}
            onChangeText={setWorkoutName}
            style={{ color: colors.textPrimary }}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={{ marginTop: 12, color: colors.textSecondary }}>
            Duration (minutes)
          </Text>
          <TextInput
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
            style={{ color: colors.textPrimary }}
            placeholderTextColor={colors.textSecondary}
          />
        </Card>

        {/* ---------- ADD EXERCISE ---------- */}
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={[
            styles.addExercise,
            { backgroundColor: colors.card },
          ]}
        >
          <Text style={{ color: colors.accent, fontWeight: "600" }}>
            ＋ Add Exercise
          </Text>
        </Pressable>

        {/* ---------- EXERCISES ---------- */}
        {exercises.map((ex, i) => (
          <ExerciseCard
            key={i}
            exercise={ex}
            index={i}
            onAddSet={() =>
              setExercises((p) =>
                p.map((e, idx) =>
                  idx === i
                    ? { ...e, sets: [...e.sets, { reps: "", weight: "" }] }
                    : e
                )
              )
            }
            onDeleteSet={(s) =>
              setExercises((p) =>
                p.map((e, idx) =>
                  idx === i
                    ? { ...e, sets: e.sets.filter((_, j) => j !== s) }
                    : e
                )
              )
            }
            onDeleteExercise={() =>
              setExercises((p) => p.filter((_, idx) => idx !== i))
            }
            onUpdateSet={(s, f, v) =>
              setExercises((p) =>
                p.map((e, idx) =>
                  idx === i
                    ? {
                        ...e,
                        sets: e.sets.map((x, j) =>
                          j === s ? { ...x, [f]: v } : x
                        ),
                      }
                    : e
                )
              )
            }
          />
        ))}

        {/* ---------- SAVE ---------- */}
        <Pressable
          onPress={saveWorkout}
          style={[
            styles.saveButton,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text style={styles.saveText}>
            Save Workout • {caloriesBurned} kcal
          </Text>
        </Pressable>
      </ScrollView>

      {/* ---------- EXERCISE PICKER MODAL (FIXED PROPS) ---------- */}
      <ExercisePickerModal
        visible={pickerVisible}
        search={search}
        setSearch={setSearch}
        availableMuscles={[...new Set(catalog.map((c) => c.target))]}
        availableEquipment={[...new Set(catalog.map((c) => c.equipment))]}
        muscleFilter={muscleFilter}
        equipmentFilter={equipmentFilter}
        setMuscleFilter={setMuscleFilter}
        setEquipmentFilter={setEquipmentFilter}
        data={catalog.filter((c) =>
          normalize(c.name).includes(normalize(search))
        )}
        onSelect={(name) => {
          addExerciseWithMemory(name);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  addExercise: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
});
