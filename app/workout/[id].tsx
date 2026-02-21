import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "../../src/firebase/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { Card } from "../../src/components/Card";
import { useTheme } from "../../src/context/ThemeContext"; // ✅ ADDED

export default function WorkoutDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const uid = auth.currentUser?.uid;
  const { colors } = useTheme(); // ✅ ADDED
  const [workout, setWorkout] = useState<any>(null);

  useEffect(() => {
    if (!uid || !id) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "users", uid, "workouts", id));
      if (snap.exists()) setWorkout(snap.data());
    };
    load();
  }, [uid, id]);

  const deleteWorkout = () => {
    if (!uid || !id) return;

    Alert.alert(
      "Delete Workout",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDoc(
              doc(db, "users", uid, "workouts", id)
            );
            router.replace("/(tabs)/workout");
          },
        },
      ]
    );
  };

  if (!workout) {
    return (
      <View style={{ padding: 16, backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ padding: 16, backgroundColor: colors.background }} // ✅
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
          color: colors.textPrimary, // ✅
        }}
      >
        {workout.name}
      </Text>

      <Card>
        <Text
          style={{
            fontWeight: "600",
            color: colors.textPrimary, // ✅
          }}
        >
          Total Volume: {(() => {
            let v = 0;
            (workout.exercises || []).forEach((ex: any) => {
              (ex.sets || []).forEach((s: any) => {
                v += (Number(s.reps) || 0) * (Number(s.weight) || 0);
              });
            });
            return v;
          })()} kg
        </Text>
      </Card>

      {(workout.exercises || []).map((e: any, i: number) => {
        const sets = e.sets || [];
        const exerciseVolume = sets.reduce(
          (sum: number, s: any) =>
            sum + (Number(s.reps) || 0) * (Number(s.weight) || 0),
          0
        );
        return (
          <Card key={i}>
            <Text
              style={{
                fontWeight: "600",
                color: colors.textPrimary, // ✅
              }}
            >
              {e.name}
            </Text>
            {sets.map((s: any, si: number) => (
              <Text key={si} style={{ color: colors.textSecondary }}>
                Set {si + 1}: {s.reps} x {s.weight} kg
              </Text>
            ))}
            <Text style={{ color: colors.textSecondary }}>
              Volume: {exerciseVolume} kg
            </Text>
          </Card>
        );
      })}

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/edit-workout/[id]",
            params: { id },
          })
        }
        style={{
          backgroundColor: colors.accent, // ✅
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          Edit Workout
        </Text>
      </Pressable>

      <Pressable
        onPress={deleteWorkout}
        style={{
          backgroundColor: colors.danger, // ✅
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          Delete Workout
        </Text>
      </Pressable>
    </ScrollView>
  );
}
