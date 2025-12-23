import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../src/firebase/firebase";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";

/* ---------- TYPES ---------- */

type SetType = {
  reps: number;
  weight: number;
};

type ExerciseType = {
  name: string;
  sets: SetType[];
};

type WorkoutType = {
  id: string;
  name: string;
  exercises: ExerciseType[];
  caloriesBurned?: number;
  createdAt?: Timestamp;
};

/* ---------- HELPERS ---------- */

function isToday(date: Date) {
  const d = new Date();
  return (
    date.getDate() === d.getDate() &&
    date.getMonth() === d.getMonth() &&
    date.getFullYear() === d.getFullYear()
  );
}

function calcVolume(exercises: ExerciseType[]) {
  let volume = 0;
  exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      volume += (s.reps || 0) * (s.weight || 0);
    });
  });
  return volume;
}

/* ---------- COMPONENT ---------- */

export default function Workout() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutType | null>(null);
  const [history, setHistory] = useState<WorkoutType[]>([]);

  /* ================= REAL-TIME WORKOUTS (FIX) ================= */

  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(
      collection(db, "users", uid, "workouts"),
      (snap) => {
        const all: WorkoutType[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WorkoutType, "id">),
        }));

        // SAFE SORT
        all.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

        let today: WorkoutType | null = null;
        const past: WorkoutType[] = [];

        all.forEach((w) => {
          const date = w.createdAt?.toDate();
          if (date && isToday(date) && !today) {
            today = w;
          } else {
            past.push(w);
          }
        });

        setTodayWorkout(today);
        setHistory(past);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  const deleteWorkout = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "workouts", id));
  };

  if (loading) return <Loading label="Loading workouts..." />;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700" }}>
            Workout
          </Text>

          <Pressable
            onPress={() => router.push("/add-workout")}
            style={{
              backgroundColor: "#2563EB",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              + Add
            </Text>
          </Pressable>
        </View>

        {/* TODAY */}
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
          Today
        </Text>

        {todayWorkout ? (
          <Card>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {todayWorkout.name}
              </Text>

              <Pressable
                onPress={() =>
                  router.push(`/edit-workout/${todayWorkout.id}`)
                }
              >
                <Text style={{ color: "#2563EB" }}>Edit</Text>
              </Pressable>
            </View>

            <Text style={{ marginTop: 6, color: "#6B7280" }}>
              📦 Volume: {calcVolume(todayWorkout.exercises)} kg
            </Text>

            <Text style={{ marginTop: 4 }}>
              🔥 Calories Burned:{" "}
              {todayWorkout.caloriesBurned ?? "—"} kcal
            </Text>
          </Card>
        ) : (
          <Text style={{ color: "#6B7280" }}>
            No workout added today
          </Text>
        )}

        {/* HISTORY */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          History
        </Text>

        {history.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>
            No past workouts yet
          </Text>
        ) : (
          history.map((w) => (
            <Card key={w.id}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontWeight: "600" }}>{w.name}</Text>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() =>
                      router.push(`/edit-workout/${w.id}`)
                    }
                  >
                    <Text style={{ color: "#2563EB" }}>Edit</Text>
                  </Pressable>

                  <Pressable onPress={() => deleteWorkout(w.id)}>
                    <Text style={{ color: "#EF4444" }}>🗑</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                {w.createdAt
                  ? w.createdAt.toDate().toDateString()
                  : "—"}
              </Text>

              <Text style={{ fontSize: 12 }}>
                🔥 {w.caloriesBurned ?? "—"} kcal
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
