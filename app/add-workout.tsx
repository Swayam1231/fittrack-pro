import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addDoc, collection, doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../src/firebase/firebase";

import { Card } from "../src/components/Card";
import { ExerciseCard } from "../src/components/ExerciseCard";
import { ExercisePickerModal } from "../src/components/ExercisePickerModal";
import { useTheme } from "../src/context/ThemeContext";
import { useExerciseCatalog } from "../src/hooks/useExerciseCatalog";

/* ===================== TYPES ===================== */

type SetEntry = { reps: string; weight: string };
type Exercise = { name: string; sets: SetEntry[] };

type LastSetMap = {
  [exerciseName: string]: { reps: number; weight: number };
};

const LAST_SET_KEY = "exercise_last_sets";

/* ===================== HELPERS ===================== */

const normalize = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s)}`;
}

/* ===================== SCREEN ===================== */

export default function AddWorkout() {
  const router = useRouter();
  const user = auth.currentUser;
  const { colors } = useTheme();

  /* ---------- EXERCISE API ---------- */

  const {
    exercises: catalog,
    loadMore,
    search,
    loading: catalogLoading,
  } = useExerciseCatalog();

  /* ---------- STATE ---------- */

  const [workoutName, setWorkoutName] = useState("");
  const [userWeight, setUserWeight] = useState(0);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [lastSets, setLastSets] = useState<LastSetMap>({});

  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  /* ---------- DEBOUNCE TIMER ---------- */

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- TIMER STATE ---------- */

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  /* ---------- LOAD USER DATA ---------- */

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

  /* ---------- LOAD INITIAL EXERCISES ---------- */

  useEffect(() => {
    search({});
  }, [search]);

  /* ---------- TIMER TICK ---------- */

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  const startWorkout = () => {
    if (isRunning) return;
    setElapsedSeconds(0);
    setIsRunning(true);
  };

  const stopWorkout = () => {
    setIsRunning(false);
  };

  /* ===================== CALORIES ===================== */

  const caloriesBurned = useMemo(() => {
    if (!user || userWeight <= 0 || elapsedSeconds <= 0) return 0;

    const durationMinutes = elapsedSeconds / 60;

    let met = 5.0;

    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

    if (totalSets >= 20) met = 6.0;
    else if (totalSets >= 12) met = 5.5;

    const calories = met * userWeight * (durationMinutes / 60);

    return Math.round(calories);
  }, [user, userWeight, elapsedSeconds, exercises]);

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

    if (!workoutName || exercises.length === 0) {
      return Alert.alert("Incomplete workout");
    }

    if (elapsedSeconds <= 0) {
      return Alert.alert("Please start and finish the workout timer.");
    }

    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    await addDoc(collection(db, "users", user.uid, "workouts"), {
      name: workoutName,
      duration: durationMinutes,
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

        <Card>
          <Text style={{ color: colors.textSecondary }}>Workout Name</Text>
          <TextInput
            value={workoutName}
            onChangeText={setWorkoutName}
            style={{ color: colors.textPrimary }}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={{ marginTop: 12, color: colors.textSecondary }}>
            Workout Timer
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              {formatTime(elapsedSeconds)}
            </Text>

            <Pressable
              onPress={isRunning ? stopWorkout : startWorkout}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: isRunning ? colors.danger : colors.accent,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {isRunning ? "Stop" : "Start"}
              </Text>
            </Pressable>
          </View>
        </Card>

        <Pressable
          onPress={() => setPickerVisible(true)}
          style={[styles.addExercise, { backgroundColor: colors.card }]}
        >
          <Text style={{ color: colors.accent, fontWeight: "600" }}>
            ＋ Add Exercise
          </Text>
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
                    : e,
                ),
              )
            }
            onDeleteSet={(s) =>
              setExercises((p) =>
                p.map((e, idx) =>
                  idx === i
                    ? { ...e, sets: e.sets.filter((_, j) => j !== s) }
                    : e,
                ),
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
                          j === s ? { ...x, [f]: v } : x,
                        ),
                      }
                    : e,
                ),
              )
            }
          />
        ))}

        <Pressable
          onPress={saveWorkout}
          style={[styles.saveButton, { backgroundColor: colors.accent }]}
        >
          <Text style={styles.saveText}>
            Save Workout • {caloriesBurned} kcal
          </Text>
        </Pressable>
      </ScrollView>

      <ExercisePickerModal
        visible={pickerVisible}
        search={searchText}
        setSearch={(t) => {
          setSearchText(t);

          if (searchTimer.current) {
            clearTimeout(searchTimer.current);
          }

          searchTimer.current = setTimeout(() => {
            search({
              search: t,
              bodyPart: muscleFilter,
              equipment: equipmentFilter,
            });
          }, 400);
        }}
        availableMuscles={[...new Set(catalog.map((c) => c.bodyPart))]}

        availableEquipment={[...new Set(catalog.map((c) => c.equipment))]}
        muscleFilter={muscleFilter}
        equipmentFilter={equipmentFilter}
        setMuscleFilter={(m) => {
          setMuscleFilter(m);
          search({
            search: searchText,
            bodyPart: m,
            equipment: equipmentFilter,
          });
        }}
        setEquipmentFilter={(e) => {
          setEquipmentFilter(e);
          search({
            search: searchText,
            bodyPart: muscleFilter,
            equipment: e,
          });
        }}
        data={catalog}
        loading={catalogLoading}
        onLoadMore={() => {}}

        onSelect={(name) => {
          addExerciseWithMemory(name);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

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
