import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "../../src/firebase/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { Card } from "../../src/components/Card";

export default function WorkoutDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const uid = auth.currentUser?.uid;
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
      <View style={{ padding: 16 }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        {workout.name}
      </Text>

      <Card>
        <Text style={{ fontWeight: "600" }}>
          Total Volume: {workout.totalVolume} kg
        </Text>
      </Card>

      {workout.exercises.map((e: any, i: number) => (
        <Card key={i}>
          <Text style={{ fontWeight: "600" }}>{e.name}</Text>
          <Text>
            {e.sets} x {e.reps} @ {e.weight} kg
          </Text>
          <Text>Volume: {e.volume} kg</Text>
        </Card>
      ))}

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/edit-workout/[id]",
            params: { id },
          })
        }
        style={{
          backgroundColor: "#2563EB",
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
          backgroundColor: "#DC2626",
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
