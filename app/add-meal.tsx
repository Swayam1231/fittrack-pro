import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { auth, db } from "../src/firebase/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { useTheme } from "../src/context/ThemeContext";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function AddMeal() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // 🔥 KEY FIX

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
      mealType: mealType || "Breakfast",
      createdAt: mealDate,
    });

    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 12, // 🔥 REAL FIX
            paddingBottom: 32,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            { color: colors.textPrimary },
          ]}
        >
          Add {mealType || "Meal"}
        </Text>

        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
          placeholder="Food name"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
          placeholder="Quantity (e.g. 100g)"
          placeholderTextColor={colors.textSecondary}
          value={quantity}
          onChangeText={setQuantity}
        />

        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
          placeholder="Calories"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={calories}
          onChangeText={setCalories}
        />

        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
          placeholder="Protein (g)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={protein}
          onChangeText={setProtein}
        />

        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
          placeholder="Carbs (g)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={carbs}
          onChangeText={setCarbs}
        />

        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
          placeholder="Fats (g)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={fats}
          onChangeText={setFats}
        />

        <Pressable
          onPress={saveMeal}
          disabled={saving}
          style={[
            styles.button,
            { backgroundColor: colors.accent },
            saving && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  button: {
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
