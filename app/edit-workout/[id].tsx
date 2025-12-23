import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../src/firebase/firebase";
import { Card } from "../../src/components/Card";

/* ---------- TYPES ---------- */

type SetType = {
  reps: number;
  weight: number;
};

type ExerciseType = {
  name: string;
  sets: SetType[];
};

/* ---------- COMPONENT ---------- */

export default function EditWorkout() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<ExerciseType[]>([]);

  /* ================= LOAD WORKOUT (FIX) ================= */

  useEffect(() => {
    if (!uid || !id) return;

    const loadWorkout = async () => {
      const ref = doc(db, "users", uid, "workouts", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const data = snap.data();

      setName(data.name ?? "");
      setExercises(data.exercises ?? []);
      setLoading(false);
    };

    loadWorkout();
  }, [uid, id]);

  /* ================= SAVE WORKOUT (FIX) ================= */

  const VOLUME_FACTOR = 0.035;

const calcVolume = () => {
  let v = 0;
  exercises.forEach((ex) =>
    ex.sets.forEach((s) => {
      v += s.reps * s.weight;
    })
  );
  return v;
};

const saveWorkout = async () => {
  if (!uid || !id || !name.trim()) return;

  const caloriesBurned = Math.round(calcVolume() * VOLUME_FACTOR);

  await updateDoc(doc(db, "users", uid, "workouts", id), {
    name,
    exercises,
    caloriesBurned,
  });

  router.back();
};


  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
          Edit Workout
        </Text>

        <Card>
          <Text style={{ fontWeight: "600" }}>Workout Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Workout name"
          />
        </Card>

        {/* ⚠️ UI BELOW IS UNCHANGED — JUST BOUND TO STATE */}
        {exercises.map((ex, exIndex) => (
          <Card key={exIndex}>
            <TextInput
              value={ex.name}
              onChangeText={(text) => {
                const copy = [...exercises];
                copy[exIndex].name = text;
                setExercises(copy);
              }}
              placeholder="Exercise name"
            />

            {ex.sets.map((s, setIndex) => (
              <View
                key={setIndex}
                style={{ flexDirection: "row", gap: 12 }}
              >
                <TextInput
                  value={String(s.reps)}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const copy = [...exercises];
                    copy[exIndex].sets[setIndex].reps = Number(text);
                    setExercises(copy);
                  }}
                  placeholder="Reps"
                />

                <TextInput
                  value={String(s.weight)}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const copy = [...exercises];
                    copy[exIndex].sets[setIndex].weight = Number(text);
                    setExercises(copy);
                  }}
                  placeholder="Weight"
                />
              </View>
            ))}
          </Card>
        ))}

        <Pressable
          onPress={saveWorkout}
          style={{
            marginTop: 24,
            backgroundColor: "#2563EB",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Save Changes
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
