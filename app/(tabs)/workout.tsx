import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FirestoreService, Workout } from "../../src/services/firestore.service";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";

/* ---------- HELPERS ---------- */

function isToday(date: Date) {
  const d = new Date();
  return (
    date.getDate() === d.getDate() &&
    date.getMonth() === d.getMonth() &&
    date.getFullYear() === d.getFullYear()
  );
}

function calcVolume(exercises: any[]) {
  let volume = 0;
  exercises.forEach((ex) => {
    ex.sets?.forEach((s: any) => {
      volume += (s.reps || 0) * (s.weight || 0);
    });
  });
  return volume;
}

/* ---------- COMPONENT ---------- */

export default function Workout() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [history, setHistory] = useState<Workout[]>([]);

  /* ================= REAL-TIME WORKOUTS ================= */

  useEffect(() => {
    if (!uid) return;

    return FirestoreService.subscribeToWorkoutHistory(uid, (all) => {
      let today: Workout | null = null;
      const past: Workout[] = [];

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
    });
  }, [uid]);

  const deleteWorkout = async (id: string) => {
    if (!uid) return;
    await FirestoreService.deleteWorkout(uid, id);
  };

  if (loading) return <Loading label="Loading workouts..." />;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }} // ✅
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.textPrimary, // ✅
            }}
          >
            Workout
          </Text>

          <Pressable
            onPress={() => router.push("/add-workout")}
            style={{
              backgroundColor: colors.accent, // ✅
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
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 8,
            color: colors.textPrimary, // ✅
          }}
        >
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
              <Text
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary, // ✅
                }}
              >
                {todayWorkout.name}
              </Text>

              <Pressable
                onPress={() =>
                  router.push(`/edit-workout/${todayWorkout.id}`)
                }
              >
                <Text style={{ color: colors.accent }}>
                  Edit
                </Text>
              </Pressable>
            </View>

            <Text
              style={{
                marginTop: 6,
                color: colors.textSecondary, // ✅
              }}
            >
              📦 Volume: {calcVolume(todayWorkout.exercises)} kg
            </Text>

            <Text
              style={{
                marginTop: 4,
                color: colors.textPrimary, // ✅
              }}
            >
              🔥 Calories Burned:{" "}
              {todayWorkout.caloriesBurned ?? "—"} kcal
            </Text>
          </Card>
        ) : (
          <Text style={{ color: colors.textSecondary }}>
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
            color: colors.textPrimary, // ✅
          }}
        >
          History
        </Text>

        {history.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>
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
                <Text
                  style={{
                    fontWeight: "600",
                    color: colors.textPrimary, // ✅
                  }}
                >
                  {w.name}
                </Text>

                <View style={{ flexDirection: "row", gap: 16 }}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/share-workout" as any,
                        params: {
                          name: w.name,
                          duration: w.duration,
                          calories: w.caloriesBurned,
                          date: w.createdAt.toDate().toLocaleDateString()
                        }
                      })
                    }
                  >
                    <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      router.push(`/edit-workout/${w.id}`)
                    }
                  >
                    <Text style={{ color: colors.accent }}>
                      Edit
                    </Text>
                  </Pressable>

                  <Pressable onPress={() => w.id && deleteWorkout(w.id)}>
                    <Text style={{ color: colors.danger }}>
                      🗑
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary, // ✅
                }}
              >
                {w.createdAt
                  ? w.createdAt.toDate().toDateString()
                  : "—"}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  color: colors.textPrimary, // ✅
                }}
              >
                🔥 {w.caloriesBurned ?? "—"} kcal
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
