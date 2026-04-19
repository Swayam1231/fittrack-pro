import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  Image,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { FirestoreService } from "../src/services/firestore.service";
import { ExerciseCard } from "../src/components/ExerciseCard";
import { ExercisePickerModal } from "../src/components/ExercisePickerModal";
import { useExerciseCatalog } from "../src/hooks/useExerciseCatalog";

const { width } = Dimensions.get("window");

type SetEntry = { reps: string; weight: string; completed?: boolean };
type Exercise = { name: string; sets: SetEntry[]; target?: string };
type LastSetMap = { [exerciseName: string]: { reps: number; weight: number } };
const LAST_SET_KEY = "exercise_last_sets";

const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function ActiveLogger() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;
  const { colors, gradients } = useTheme();

  const { exercises: catalog, search, loading: catalogLoading } = useExerciseCatalog();
  const [profile, setProfile] = useState<any>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);
  const [lastSets, setLastSets] = useState<LastSetMap>({});
  
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [activePR, setActivePR] = useState<{ name: string; weight: number; reps: number } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubProfile = FirestoreService.subscribeToProfile(uid, setProfile);
    AsyncStorage.getItem(LAST_SET_KEY).then((d) => d && setLastSets(JSON.parse(d)));
    search({});
    return () => unsubProfile();
  }, [uid]);

  useEffect(() => {
    let latestPR: any = null;
    exercises.forEach(ex => {
      const history = lastSets[normalize(ex.name)];
      if (history) {
        ex.sets.forEach(set => {
          const currentWeight = parseFloat(set.weight);
          if (!isNaN(currentWeight) && currentWeight > history.weight) {
            latestPR = { name: ex.name, weight: currentWeight, reps: parseInt(set.reps) || 0 };
          }
        });
      }
    });
    setActivePR(latestPR);
  }, [exercises, lastSets]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const caloriesBurned = useMemo(() => {
    const durationMinutes = elapsedSeconds / 60;
    let met = 5.5; 
    return Math.round(met * (profile?.weight || 75) * (durationMinutes / 60));
  }, [elapsedSeconds, profile]);

  const addExerciseWithMemory = (name: string) => {
    const remembered = lastSets[normalize(name)];
    const exerciseData = catalog.find(c => c.name === name);
    setExercises((p) => [...p, { 
      name, 
      target: exerciseData?.instructions?.length ? `Last: ${remembered?.weight}kg x ${remembered?.reps}` : undefined,
      sets: [{ reps: remembered ? String(remembered.reps) : "", weight: remembered ? String(remembered.weight) : "", completed: false }] 
    }]);
  };

  const saveWorkout = async () => {
    if (!uid) return;
    if (exercises.length === 0) return Alert.alert("Protocol Empty", "Add some movements first.");
    await FirestoreService.addWorkout(uid, {
      name: workoutName || "Strength Protocol",
      duration: Math.max(1, Math.round(elapsedSeconds / 60)),
      caloriesBurned,
      createdAt: Timestamp.now(),
      exercises: exercises as any,
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
           <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.brand, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Active Protocol</Text>
        <Pressable onPress={() => setIsRunning(!isRunning)}>
           <Ionicons name={isRunning ? "pause" : "play"} size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
         {/* --- TIMER HERO --- */}
         <View style={styles.timerHero}>
            <View style={[styles.timerCapsule, { backgroundColor: colors.surfaceContainerLow }]}>
               <Text style={[styles.timerValue, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{formatTime(elapsedSeconds)}</Text>
               <Text style={[styles.timerLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>ELAPSED TIME</Text>
            </View>
            <View style={styles.sessionInfo}>
               <TextInput 
                 value={workoutName}
                 onChangeText={setWorkoutName}
                 placeholder="Session Title..."
                 placeholderTextColor={colors.onSurfaceVariant}
                 style={[styles.nameInput, { color: colors.primary, fontFamily: 'SpaceGrotesk-Bold' }]}
               />
               <Text style={[styles.calCount, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>{caloriesBurned} kcal projected</Text>
            </View>
         </View>

         {/* --- EXERCISE LIST --- */}
         <View style={styles.exerciseSection}>
            {exercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                index={i}
                onAddSet={() => setExercises(p => p.map((e, idx) => idx === i ? { ...e, sets: [...e.sets, { reps: "", weight: "", completed: false }] } : e))}
                onDeleteSet={(s) => setExercises(p => p.map((e, idx) => idx === i ? { ...e, sets: e.sets.filter((_, j) => j !== s) } : e))}
                onDeleteExercise={() => setExercises(p => p.filter((_, idx) => idx !== i))}
                onUpdateSet={(s, f, v) => setExercises(p => p.map((e, idx) => idx === i ? { ...e, sets: e.sets.map((x, j) => j === s ? { ...x, [f]: v } : x) } : e))}
                onToggleComplete={(s) => setExercises(prev => prev.map((exArr, arrIdx) => arrIdx === i ? { ...exArr, sets: exArr.sets.map((st, sIdx) => sIdx === s ? { ...st, completed: !st.completed } : st) } : exArr))}
              />
            ))}

            <Pressable onPress={() => setPickerVisible(true)} style={[styles.addMovementBtn, { backgroundColor: colors.surfaceContainerLow }]}>
               <Ionicons name="add" size={24} color={colors.primary} />
               <Text style={[styles.addMovementText, { color: colors.primary, fontFamily: 'Manrope-Bold' }]}>ADD MOVEMENT</Text>
            </Pressable>
         </View>

         {/* --- PR ALERT --- */}
         {activePR && (
            <Animated.View entering={FadeInUp} style={styles.prAlert}>
               <LinearGradient colors={['#4CAF50', '#81C784']} style={styles.prGradient} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Ionicons name="trophy" size={20} color="#fff" />
                  <Text style={[styles.prText, { fontFamily: 'Manrope-Bold' }]}>NEW RECORD DETECTED: {activePR.name.toUpperCase()}</Text>
               </LinearGradient>
            </Animated.View>
         )}
      </ScrollView>

      {/* --- FOOTER ACTION --- */}
      <View style={styles.footer}>
         <Pressable onPress={saveWorkout} style={styles.completeBtn}>
            <LinearGradient colors={gradients.primary} style={styles.completeBtnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
               <Text style={[styles.completeBtnText, { fontFamily: 'Manrope-Bold' }]}>COMPLETE PROTOCOL</Text>
            </LinearGradient>
         </Pressable>
      </View>

      <ExercisePickerModal
        visible={pickerVisible}
        search={searchText}
        setSearch={(t) => { setSearchText(t); search({ search: t, bodyPart: muscleFilter, equipment: equipmentFilter }); }}
        availableMuscles={[...new Set(catalog.map(c => c.bodyPart))]}
        availableEquipment={[...new Set(catalog.map(c => c.equipment))]}
        muscleFilter={muscleFilter}
        equipmentFilter={equipmentFilter}
        setMuscleFilter={(m) => { setMuscleFilter(m); search({ search: searchText, bodyPart: m, equipment: equipmentFilter }); }}
        setEquipmentFilter={(e) => { setEquipmentFilter(e); search({ search: searchText, bodyPart: muscleFilter, equipment: e }); }}
        data={catalog}
        loading={catalogLoading}
        onLoadMore={() => {}}
        onSelect={(name) => { addExerciseWithMemory(name); setPickerVisible(false); }}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  brand: { fontSize: 18, letterSpacing: -0.5 },
  scroll: { paddingBottom: 120 },
  timerHero: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  timerCapsule: { width: width * 0.8, padding: 32, borderRadius: 40, alignItems: 'center', marginBottom: 24 },
  timerValue: { fontSize: 64, letterSpacing: -2 },
  timerLabel: { fontSize: 10, letterSpacing: 2, marginTop: 4 },
  sessionInfo: { alignItems: 'center' },
  nameInput: { fontSize: 24, textAlign: 'center', letterSpacing: -0.5 },
  calCount: { fontSize: 14, marginTop: 4 },
  exerciseSection: { paddingHorizontal: 24, gap: 16 },
  addMovementBtn: { height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  addMovementText: { fontSize: 14, letterSpacing: 1 },
  prAlert: { paddingHorizontal: 24, marginTop: 24 },
  prGradient: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12 },
  prText: { color: '#fff', fontSize: 11, letterSpacing: 0.5 },
  footer: { padding: 24, position: 'absolute', bottom: 0, left: 0, right: 0 },
  completeBtn: { height: 64, borderRadius: 32, overflow: 'hidden' },
  completeBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  completeBtnText: { color: '#fff', fontSize: 16, letterSpacing: 0.5 },
});
