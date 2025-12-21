import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { auth, db } from "../../src/firebase/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Card } from "../../src/components/Card";

export default function EditMeal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  /* ------------------ LOAD MEAL ------------------ */
  useEffect(() => {
    if (!uid || !id) return;

    const loadMeal = async () => {
      const ref = doc(db, "users", uid, "meals", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setName(data.name);
        setCalories(String(data.calories));
        setProtein(String(data.protein));
        setCarbs(String(data.carbs));
        setFats(String(data.fats));
      }
    };

    loadMeal();
  }, [uid, id]);

  /* ------------------ VALIDATION ------------------ */
  const isValid =
    name.trim().length > 0 &&
    Number(calories) > 0 &&
    Number(protein) >= 0 &&
    Number(carbs) >= 0 &&
    Number(fats) >= 0;

  /* ------------------ ACTIONS ------------------ */
  const saveChanges = async () => {
    if (!uid || !id || !isValid) return;

    await updateDoc(doc(db, "users", uid, "meals", id), {
      name: name.trim(),
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fats: Number(fats),
    });

    router.back();
  };

  const deleteMeal = async () => {
    if (!uid || !id) return;

    await deleteDoc(doc(db, "users", uid, "meals", id));
    router.back();
  };

  /* ------------------ UI ------------------ */
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
          Edit Meal
        </Text>

        <Card>
          <Text>Meal Name</Text>
          <TextInput value={name} onChangeText={setName} />

          <Text style={{ marginTop: 12 }}>Calories (kcal)</Text>
          <TextInput
            keyboardType="numeric"
            value={calories}
            onChangeText={setCalories}
          />

          <Text style={{ marginTop: 12 }}>Protein (g)</Text>
          <TextInput
            keyboardType="numeric"
            value={protein}
            onChangeText={setProtein}
          />

          <Text style={{ marginTop: 12 }}>Carbs (g)</Text>
          <TextInput
            keyboardType="numeric"
            value={carbs}
            onChangeText={setCarbs}
          />

          <Text style={{ marginTop: 12 }}>Fats (g)</Text>
          <TextInput
            keyboardType="numeric"
            value={fats}
            onChangeText={setFats}
          />
        </Card>
      </ScrollView>

      {/* ACTION BUTTONS */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Pressable
          onPress={saveChanges}
          disabled={!isValid}
          style={{
            backgroundColor: isValid ? "#2563EB" : "#9CA3AF",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Save Changes
          </Text>
        </Pressable>

        <Pressable
          onPress={deleteMeal}
          style={{
            backgroundColor: "#DC2626",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Delete Meal
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
