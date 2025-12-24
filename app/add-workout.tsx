import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { auth, db } from "../src/firebase/firebase";
import { addDoc, collection, Timestamp, doc, getDoc } from "firebase/firestore";
import { Card } from "../src/components/Card";
import {
  useExerciseCatalog,
  ExerciseCatalogItem,
} from "../src/hooks/useExerciseCatalog";

/* ------------------ TYPES ------------------ */

type SetEntry = {
  reps: string;
  weight: string;
};

type Exercise = {
  name: string;
  sets: SetEntry[];
};

type RecentExercise = {
  name: string;
  count: number;
};

type ScoredExercise = ExerciseCatalogItem & {
  score: number;
};

/* ------------------ CONSTANTS ------------------ */

const MET = 6;
const VOLUME_FACTOR = 0.035;
const RECENT_KEY = "recent_exercises";

/* ------------------ HELPERS ------------------ */

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/* ------------------ COMPONENT ------------------ */

export default function AddWorkout() {
  const router = useRouter();
  const user = auth.currentUser;

  const { exercises: catalog } = useExerciseCatalog();

  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState("");
  const [userWeight, setUserWeight] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState("");

  const [recent, setRecent] = useState<RecentExercise[]>([]);
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  /* ------------------ LOAD USER + RECENT ------------------ */

  useEffect(() => {
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        setUserWeight(Number(snap.data().weight || 0));
      }
    });

    AsyncStorage.getItem(RECENT_KEY).then((data) => {
      if (data) setRecent(JSON.parse(data));
    });
  }, [user]);

  if (!user) return null;

  /* ------------------ RECENT BOOST ------------------ */

  const getRecentBoost = (exerciseName: string) => {
    const match = recent.find(
      (r) => normalize(r.name) === normalize(exerciseName)
    );
    if (!match) return 0;
    return Math.min(5, Math.log2(match.count + 1));
  };

  const saveRecent = async (name: string) => {
    const key = normalize(name);
    const updated = [...recent];
    const idx = updated.findIndex((r) => normalize(r.name) === key);

    if (idx >= 0) updated[idx].count += 1;
    else updated.push({ name, count: 1 });

    updated.sort((a, b) => b.count - a.count);
    setRecent(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  /* ------------------ CALCULATIONS ------------------ */

  const calcVolume = () => {
    let v = 0;
    exercises.forEach((ex) =>
      ex.sets.forEach((s) => {
        v += Number(s.reps) * Number(s.weight);
      })
    );
    return v;
  };

  const metCalories =
    userWeight && duration
      ? Math.round(MET * userWeight * (Number(duration) / 60))
      : 0;

  const volumeCalories = Math.round(calcVolume() * VOLUME_FACTOR);
  const caloriesBurned = Math.max(metCalories, volumeCalories);

  /* ------------------ ACTIONS ------------------ */

  const addExercise = () => {
    setExercises((prev) => [
      ...prev,
      { name: "", sets: [{ reps: "", weight: "" }] },
    ]);
    setSearch("");
    setMuscleFilter(null);
    setEquipmentFilter(null);
    setPickerVisible(true);
  };

  const addSet = (exerciseIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? { ...ex, sets: [...ex.sets, { reps: "", weight: "" }] }
          : ex
      )
    );
  };

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.filter((_, s) => s !== setIndex),
            }
          : ex
      )
    );
  };

  const deleteExercise = (index: number) => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to remove this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setExercises((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  /* ------------------ SAVE WORKOUT ------------------ */

  const saveWorkout = async () => {
    if (!workoutName.trim()) return Alert.alert("Missing workout name");
    if (!duration || Number(duration) <= 0)
      return Alert.alert("Enter valid duration");
    if (exercises.length === 0) return Alert.alert("Add at least one exercise");

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
    } catch {
      Alert.alert("Failed to save workout");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------ SEARCH + FILTER ------------------ */

  const availableMuscles = useMemo(
    () => Array.from(new Set(catalog.map((e) => e.target))).sort(),
    [catalog]
  );

  const availableEquipment = useMemo(
    () => Array.from(new Set(catalog.map((e) => e.equipment))).sort(),
    [catalog]
  );

  const filteredCatalog = useMemo<ScoredExercise[]>(() => {
    const q = normalize(search);

    return catalog
      .filter((ex) => {
        if (muscleFilter && ex.target !== muscleFilter) return false;
        if (equipmentFilter && ex.equipment !== equipmentFilter) return false;
        return true;
      })
      .map((ex) => {
        let score = 0;
        const name = normalize(ex.name);

        if (q) {
          if (name.startsWith(q)) score += 3;
          if (name.includes(q)) score += 1;
        }

        score += getRecentBoost(ex.name);
        return { ...ex, score };
      })
      .filter((ex) => (!q ? true : ex.score > 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }, [search, catalog, recent, muscleFilter, equipmentFilter]);

  /* ------------------ UI ------------------ */

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
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

        <Pressable onPress={addExercise} style={styles.addExercise}>
          <Text style={styles.addExerciseText}>＋ Add Exercise</Text>
        </Pressable>

        {/* -------- ADDED EXERCISES -------- */}

        {exercises.map((ex, idx) => (
          <Card key={idx} style={{ marginTop: 12 }}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseTitle}>
                {ex.name || "Select exercise"}
              </Text>

              <Pressable onPress={() => deleteExercise(idx)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>

            {ex.sets.map((set, sIdx) => (
              <View key={sIdx} style={styles.setRow}>
                <TextInput
                  placeholder="Reps"
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(v) =>
                    setExercises((prev) =>
                      prev.map((e, i) =>
                        i === idx
                          ? {
                              ...e,
                              sets: e.sets.map((s, j) =>
                                j === sIdx ? { ...s, reps: v } : s
                              ),
                            }
                          : e
                      )
                    )
                  }
                  style={styles.setInput}
                />

                <TextInput
                  placeholder="Weight"
                  keyboardType="numeric"
                  value={set.weight}
                  onChangeText={(v) =>
                    setExercises((prev) =>
                      prev.map((e, i) =>
                        i === idx
                          ? {
                              ...e,
                              sets: e.sets.map((s, j) =>
                                j === sIdx ? { ...s, weight: v } : s
                              ),
                            }
                          : e
                      )
                    )
                  }
                  style={styles.setInput}
                />

                <Pressable onPress={() => deleteSet(idx, sIdx)}>
                  <Text style={styles.deleteSet}>✕</Text>
                </Pressable>
              </View>
            ))}

            <Pressable onPress={() => addSet(idx)}>
              <Text style={{ color: "#2563EB", marginTop: 6 }}>+ Add Set</Text>
            </Pressable>
          </Card>
        ))}

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

      {/* -------- EXERCISE PICKER MODAL -------- */}

      <Modal visible={pickerVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <View style={{ padding: 16 }}>
            <Text style={styles.modalTitle}>Select Exercise</Text>

            <TextInput
              placeholder="Search exercise"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: "center",
                paddingVertical: 6,
              }}
            >
              {availableMuscles.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMuscleFilter((p) => (p === m ? null : m))}
                  style={[styles.chip, muscleFilter === m && styles.chipActive]}
                >
                  <Text>{m}</Text>
                </Pressable>
              ))}
              {availableEquipment.map((e) => (
                <Pressable
                  key={e}
                  onPress={() =>
                    setEquipmentFilter((p) => (p === e ? null : e))
                  }
                  style={[
                    styles.chip,
                    equipmentFilter === e && styles.chipActive,
                  ]}
                >
                  <Text>{e}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredCatalog}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={styles.exerciseItem}
                onPress={() => {
                  setExercises((prev) => {
                    if (!prev.length) return prev;
                    const last = prev.length - 1;
                    return prev.map((ex, i) =>
                      i === last ? { ...ex, name: item.name } : ex
                    );
                  });
                  saveRecent(item.name);
                  setPickerVisible(false);
                }}
              >
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.target} · {item.equipment}
                </Text>
              </Pressable>
            )}
          />

          <View style={{ padding: 16 }}>
            <Pressable
              onPress={() => setPickerVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ------------------ STYLES ------------------ */

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

  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  searchInput: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },

  chip: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 18,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#93C5FD",
  },

  exerciseItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  exerciseName: { fontSize: 15 },
  exerciseMeta: { fontSize: 12, color: "#6B7280" },

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
    color: "#DC2626",
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
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },

  deleteSet: {
    color: "#DC2626",
    fontSize: 18,
    paddingHorizontal: 6,
  },

  closeButton: {
    padding: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: { fontWeight: "600" },
});
