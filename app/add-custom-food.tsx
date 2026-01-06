import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../src/firebase/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { useTheme } from "../src/context/ThemeContext";

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});

/* ================= COMPONENT ================= */

export default function AddCustomFood() {
  const { colors } = useTheme();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  const saveFood = async () => {
    if (!uid || !name || !calories) return;

    await addDoc(collection(db, "users", uid, "customFoods"), {
      name: name.trim(),
      caloriesPer100g: Number(calories),
      proteinPer100g: Number(protein) || 0,
      carbsPer100g: Number(carbs) || 0,
      fatsPer100g: Number(fats) || 0,
      source: "custom",
      createdAt: Timestamp.now(),
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Add Custom Food (per 100g)
        </Text>

        {/* FOOD NAME */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Food name"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        {/* CALORIES */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          keyboardType="numeric"
          placeholder="Calories per 100g"
          placeholderTextColor={colors.textSecondary}
          value={calories}
          onChangeText={setCalories}
        />

        {/* PROTEIN */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          keyboardType="numeric"
          placeholder="Protein (g)"
          placeholderTextColor={colors.textSecondary}
          value={protein}
          onChangeText={setProtein}
        />

        {/* CARBS */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          keyboardType="numeric"
          placeholder="Carbs (g)"
          placeholderTextColor={colors.textSecondary}
          value={carbs}
          onChangeText={setCarbs}
        />

        {/* FATS */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          keyboardType="numeric"
          placeholder="Fats (g)"
          placeholderTextColor={colors.textSecondary}
          value={fats}
          onChangeText={setFats}
        />

        {/* SAVE */}
        <Pressable
          onPress={saveFood}
          style={[styles.button, { backgroundColor: colors.accent }]}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
