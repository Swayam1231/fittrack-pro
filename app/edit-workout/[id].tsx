import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  addDoc,
  collection,
  serverTimestamp,
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

export default function AddWorkout() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<ExerciseType[]>([
    { name: "", sets: [{ reps: 0, weight: 0 }] },
  ]);

  const saveWorkout = async () => {
    if (!uid || !name.trim()) return;

    await addDoc(collection(db, "users", uid, "workouts"), {
      name,
      exercises,
      caloriesBurned: 0,      // ✅ already expected by workout tab
      createdAt: serverTimestamp(), // ✅ CRITICAL FIX
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
          Add Workout
        </Text>

        <Card>
          <Text style={{ fontWeight: "600" }}>Workout Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Workout name"
          />
        </Card>

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
            Save Workout
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
