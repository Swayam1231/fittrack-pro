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

/* ===================== TYPES ===================== */

type SetEntry = { reps: string; weight: string };
type Exercise = { name: string; sets: SetEntry[] };

type LastSetMap = {
  [exerciseName: string]: { reps: number; weight: number };
};

/* ===================== CONSTANTS ===================== */

// Tier-1
const BASE_MET = 6;
const VOLUME_FACTOR = 0.035;

// Tier-2 (physics)
const MUSCLE_EFFICIENCY = 0.25;
const JOULES_PER_KCAL = 4184;

// Tier-2.5 (MET per exercise)
const MET_MIN = 3.5;
const MET_MAX = 9.0;

// ROM
const ROM_MIN = 0.25;
const ROM_MAX = 0.85;

const LAST_SET_KEY = "exercise_last_sets";

/* ===================== HELPERS ===================== */

const normalize = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

/* -------- MET helpers -------- */

const baseMetByTarget = (target?: string) => {
  if (!target) return 5.5;
  if (["legs", "back", "chest"].includes(target)) return 6.5;
  if (["shoulders", "glutes"].includes(target)) return 6.0;
  return 5.0; // arms / core
};

const equipmentMetModifier = (equipment?: string) => {
  if (!equipment) return 0;
  if (equipment.includes("barbell")) return 0.5;
  if (equipment.includes("body")) return -0.5;
  return 0;
};

/* -------- ROM helpers -------- */

const baseROMByTarget = (target?: string) => {
  if (!target) return 0.5;
  if (["legs", "glutes"].includes(target)) return 0.7;
  if (["back"].includes(target)) return 0.6;
  if (["chest", "shoulders"].includes(target)) return 0.5;
  if (["arms"].includes(target)) return 0.3;
  if (["core"].includes(target)) return 0.25;
  return 0.5;
};

const equipmentROMModifier = (equipment?: string) => {
  if (!equipment) return 0;
  if (equipment.includes("barbell")) return 0.05;
  if (equipment.includes("dumbbell")) return 0.03;
  if (equipment.includes("body")) return 0.08;
  if (equipment.includes("machine")) return -0.05;
  return 0;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/* ===================== SCREEN ===================== */

export default function AddWorkout() {
  const router = useRouter();
  const user = auth.currentUser;
  const { exercises: catalog } = useExerciseCatalog();

  /* ---------- STATE ---------- */

  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState(""); // minutes
  const [userWeight, setUserWeight] = useState(0);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState("");

  const [lastSets, setLastSets] = useState<LastSetMap>({});

  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  /* ---------- LOAD DATA (NO EARLY RETURN) ---------- */

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

  /* ===================== CALORIE ENGINE ===================== */

  const caloriesBurned = useMemo(() => {
    if (!user || !duration) return 0;

    /* ---- Tier-1: global MET + volume ---- */

    let volume = 0;
    exercises.forEach((ex) =>
      ex.sets.forEach((s) => {
        volume += Number(s.reps) * Number(s.weight);
      })
    );

    const tier1Met =
      userWeight > 0
        ? BASE_MET * userWeight * (Number(duration) / 60)
        : 0;

    const tier1Volume = volume * VOLUME_FACTOR;

    /* ---- Tier-2: physics (ROM-based work) ---- */

    let mechanicalWork = 0;
    let totalSets = 0;

    exercises.forEach((ex) => {
      const meta = catalog.find(
        (c) => normalize(c.name) === normalize(ex.name)
      );

      let rom =
        baseROMByTarget(meta?.target) +
        equipmentROMModifier(meta?.equipment);

      rom = clamp(rom, ROM_MIN, ROM_MAX);

      ex.sets.forEach((s) => {
        if (Number(s.reps) > 0 && Number(s.weight) > 0) {
          mechanicalWork += Number(s.reps) * Number(s.weight) * rom;
          totalSets++;
        }
      });
    });

    const tier2 =
      mechanicalWork > 0
        ? ((mechanicalWork * (1 + totalSets * 0.02)) /
            MUSCLE_EFFICIENCY) /
          JOULES_PER_KCAL
        : 0;

    /* ---- Tier-2.5: MET per exercise ---- */

    let tier25 = 0;

    if (userWeight > 0 && exercises.length > 0) {
      const setsTotal = exercises.reduce(
        (s, e) => s + e.sets.length,
        0
      );

      exercises.forEach((ex) => {
        const meta = catalog.find(
          (c) => normalize(c.name) === normalize(ex.name)
        );

        let met =
          baseMetByTarget(meta?.target) +
          equipmentMetModifier(meta?.equipment);

        const avgLoad =
          ex.sets.reduce((s, x) => s + Number(x.weight), 0) /
          Math.max(1, ex.sets.length);

        if (avgLoad >= userWeight * 0.7) met += 0.5;
        else if (avgLoad >= userWeight * 0.4) met += 0.2;

        met = clamp(met, MET_MIN, MET_MAX);

        const exerciseDuration =
          (Number(duration) * ex.sets.length) / setsTotal;

        tier25 += met * userWeight * (exerciseDuration / 60);
      });
    }

    return Math.round(
      Math.max(tier1Met, tier1Volume, tier2, tier25)
    );
  }, [user, duration, userWeight, exercises, catalog]);

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

  const saveLastSets = async () => {
    const updated = { ...lastSets };

    exercises.forEach((ex) => {
      const valid = ex.sets.filter(
        (s) => Number(s.reps) > 0 && Number(s.weight) > 0
      );
      if (!valid.length) return;

      const last = valid[valid.length - 1];
      updated[normalize(ex.name)] = {
        reps: Number(last.reps),
        weight: Number(last.weight),
      };
    });

    setLastSets(updated);
    await AsyncStorage.setItem(LAST_SET_KEY, JSON.stringify(updated));
  };

  const saveWorkout = async () => {
    if (!user) return;
    if (!workoutName || !duration || exercises.length === 0) {
      return Alert.alert("Incomplete workout");
    }

    await saveLastSets();

    await addDoc(collection(db, "users", user.uid, "workouts"), {
      name: workoutName,
      duration: Number(duration),
      caloriesBurned,
      createdAt: Timestamp.now(),
      exercises,
    });

    router.back();
  };

  /* ===================== RENDER GUARD ===================== */

  if (!user) return null;

  /* ===================== UI ===================== */

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
        </Card>

        <Pressable
          onPress={() => setPickerVisible(true)}
          style={styles.addExercise}
        >
          <Text style={styles.addExerciseText}>＋ Add Exercise</Text>
        </Pressable>

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

        <Pressable onPress={saveWorkout} style={styles.saveButton}>
          <Text style={styles.saveText}>
            Save Workout • {caloriesBurned} kcal
          </Text>
        </Pressable>
      </ScrollView>

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
    </>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 12, color: "#6B7280" },
  addExercise: {
    marginTop: 16,
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
