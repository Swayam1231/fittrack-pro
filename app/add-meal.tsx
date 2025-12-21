import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { auth, db } from "../src/firebase/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";

export default function AddMeal() {
  const router = useRouter();

  const { mealType, date } = useLocalSearchParams<{
    mealType?: string;
    date?: string;
  }>();

  const uid = auth.currentUser?.uid;

  /* ---------- FORM STATE ---------- */

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---------- SAVE ---------- */

  const saveMeal = async () => {
    if (!uid || !name.trim()) return;

    setSaving(true);

    // ✅ USE DATE FROM NUTRITION TAB
    const mealDate = date
      ? Timestamp.fromDate(new Date(date))
      : Timestamp.now();

    await addDoc(collection(db, "users", uid, "meals"), {
      name: name.trim(),
      quantity: quantity.trim(),

      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,

      // 🔴 REQUIRED FOR GROUPING
      mealType: mealType || "Breakfast",

      // 🔴 REQUIRED FOR DATE HISTORY
      createdAt: mealDate,
    });

    setSaving(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Add {mealType || "Meal"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Food name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Quantity (e.g. 100g)"
        value={quantity}
        onChangeText={setQuantity}
      />

      <TextInput
        style={styles.input}
        placeholder="Calories"
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />

      <TextInput
        style={styles.input}
        placeholder="Protein (g)"
        keyboardType="numeric"
        value={protein}
        onChangeText={setProtein}
      />

      <TextInput
        style={styles.input}
        placeholder="Carbs (g)"
        keyboardType="numeric"
        value={carbs}
        onChangeText={setCarbs}
      />

      <TextInput
        style={styles.input}
        placeholder="Fats (g)"
        keyboardType="numeric"
        value={fats}
        onChangeText={setFats}
      />

      <Pressable
        onPress={saveMeal}
        disabled={saving}
        style={[
          styles.button,
          saving && { opacity: 0.6 },
        ]}
      >
        <Text style={styles.buttonText}>
          {saving ? "Saving..." : "Save"}
        </Text>
      </Pressable>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
