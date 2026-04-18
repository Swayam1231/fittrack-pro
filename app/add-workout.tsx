import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { FirestoreService } from "../src/services/firestore.service";

import { Card } from "../src/components/Card";
import { ExerciseCard } from "../src/components/ExerciseCard";
import { ExercisePickerModal } from "../src/components/ExercisePickerModal";
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
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ===================== SCREEN ===================== */

export default function AddWorkout() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;
  const { colors, gradients } = useTheme();

  /* ---------- EXERCISE API ---------- */
  const { exercises: catalog, search, loading: catalogLoading } = useExerciseCatalog();

  /* ---------- STATE ---------- */
  const [workoutName, setWorkoutName] = useState("");
  const [userWeight, setUserWeight] = useState(70);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [lastSets, setLastSets] = useState<LastSetMap>({});
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- TIMER STATE ---------- */
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  /* ---------- LOAD USER DATA ---------- */
  useEffect(() => {
    if (!uid) return;

    FirestoreService.subscribeToProfile(uid, (data) => {
      if (data && data.weight) setUserWeight(data.weight);
    });

    AsyncStorage.getItem(LAST_SET_KEY).then((d) => {
      if (d) setLastSets(JSON.parse(d));
    });
  }, [uid]);

  useEffect(() => {
    search({});
  }, [search]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  /* ===================== CALORIES ===================== */
  const caloriesBurned = useMemo(() => {
    if (!uid || userWeight <= 0 || elapsedSeconds <= 0) return 0;
    const durationMinutes = elapsedSeconds / 60;
    let met = 5.0;
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    if (totalSets >= 20) met = 6.0;
    else if (totalSets >= 12) met = 5.5;
    return Math.round(met * userWeight * (durationMinutes / 60));
  }, [uid, userWeight, elapsedSeconds, exercises]);

  /* ===================== ACTIONS ===================== */
  const addExerciseWithMemory = (name: string) => {
    const remembered = lastSets[normalize(name)];
    setExercises((p) => [
      ...p,
      {
        name,
        sets: [{ reps: remembered ? String(remembered.reps) : "", weight: remembered ? String(remembered.weight) : "" }],
      },
    ]);
  };

  const saveWorkout = async () => {
    if (!uid) return;
    if (!workoutName || exercises.length === 0) return Alert.alert("Incomplete workout");

    await FirestoreService.addWorkout(uid, {
      name: workoutName,
      duration: Math.max(1, Math.round(elapsedSeconds / 60)),
      caloriesBurned,
      createdAt: Timestamp.now(),
      exercises: exercises as any,
    });

    router.back();
  };

  if (!uid) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(600)}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: 8, letterSpacing: -1 }}>Finish Strong</Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24 }}>Excellent work on your session!</Text>
        </Animated.View>

        {/* --- TIMER HERO --- */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <LinearGradient
            colors={isRunning ? gradients.primary : ["#475569", "#1e293b"]}
            style={{ borderRadius: 24, padding: 24, marginBottom: 24, alignItems: "center", shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 }}
          >
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", marginBottom: 8 }}>Workout Duration</Text>
            <Text style={{ color: "#fff", fontSize: 48, fontWeight: "800", marginBottom: 20 }}>{formatTime(elapsedSeconds)}</Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => setIsRunning(!isRunning)} style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{isRunning ? "Pause" : "Resume"}</Text>
              </Pressable>
              <View style={{ backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{caloriesBurned} kcal</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* --- WORKOUT INFO --- */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Card style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 }}>Workout Name</Text>
            <TextInput
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g. Leg Day Push"
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.surface, borderRadius: 12, height: 50, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
            />
          </Card>
        </Animated.View>

        {/* --- EXERCISES --- */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary }}>Exercises</Text>
            <Pressable onPress={() => setPickerVisible(true)} style={{ backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          </View>

          {exercises.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center", backgroundColor: colors.surface, borderRadius: 20, borderStyle: "dashed", borderWidth: 2, borderColor: colors.border }}>
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>No exercises added yet</Text>
            </View>
          ) : (
            exercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                index={i}
                onAddSet={() => setExercises(p => p.map((e, idx) => idx === i ? { ...e, sets: [...e.sets, { reps: "", weight: "" }] } : e))}
                onDeleteSet={(s) => setExercises(p => p.map((e, idx) => idx === i ? { ...e, sets: e.sets.filter((_, j) => j !== s) } : e))}
                onDeleteExercise={() => setExercises(p => p.filter((_, idx) => idx !== i))}
                onUpdateSet={(s, f, v) => setExercises(p => p.map((e, idx) => idx === i ? { ...e, sets: e.sets.map((x, j) => j === s ? { ...x, [f]: v } : x) } : e))}
              />
            ))
          )}

          <Pressable
            onPress={saveWorkout}
            style={{ backgroundColor: colors.primary, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 40, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Log Workout</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <ExercisePickerModal
        visible={pickerVisible}
        search={searchText}
        setSearch={(t) => {
          setSearchText(t);
          if (searchTimer.current) clearTimeout(searchTimer.current);
          searchTimer.current = setTimeout(() => search({ search: t, bodyPart: muscleFilter, equipment: equipmentFilter }), 400);
        }}
        availableMuscles={[...new Set(catalog.map((c) => c.bodyPart))]}
        availableEquipment={[...new Set(catalog.map((c) => c.equipment))]}
        muscleFilter={muscleFilter}
        equipmentFilter={equipmentFilter}
        setMuscleFilter={(m) => { setMuscleFilter(m); search({ search: searchText, bodyPart: m, equipment: equipmentFilter }); }}
        setEquipmentFilter={(e) => { setEquipmentFilter(e); search({ search: searchText, bodyPart: muscleFilter, equipment: e }); }}
        data={catalog}
        loading={catalogLoading}
        onLoadMore={() => { }}
        onSelect={(name) => { addExerciseWithMemory(name); setPickerVisible(false); }}
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
