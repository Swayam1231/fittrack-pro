import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/context/ThemeContext";
import { addFoodToLibraryIfMissing } from "../src/data/foodLibrary";
import { auth, db } from "../src/firebase/firebase";

/* ================= TYPES ================= */

type RouteParams = {
  prefillName?: string;
  prefillCalories?: string;
  prefillProtein?: string;
  prefillCarbs?: string;
  prefillFats?: string;
  source?: string;
};

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
  const params = useLocalSearchParams<RouteParams>();
  const uid = auth.currentUser?.uid;

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  /* ================= PREFILL FROM ROUTE ================= */

  useEffect(() => {
    if (params.prefillName) setName(params.prefillName);
    if (params.prefillCalories) setCalories(params.prefillCalories);
    if (params.prefillProtein) setProtein(params.prefillProtein);
    if (params.prefillCarbs) setCarbs(params.prefillCarbs);
    if (params.prefillFats) setFats(params.prefillFats);
  }, [params]);

  /* ================= VALIDATION ================= */

  const isInvalidNumber = (v: string) =>
    v !== "" && Number(v) < 0;

  const saveFood = async () => {
    if (!uid) return;

    if (!name.trim()) {
      Alert.alert("Food name required");
      return;
    }

    if (!calories || Number(calories) <= 0) {
      Alert.alert("Calories must be greater than 0");
      return;
    }

    if (
      isInvalidNumber(protein) ||
      isInvalidNumber(carbs) ||
      isInvalidNumber(fats)
    ) {
      Alert.alert("Macros cannot be negative");
      return;
    }

    const foodPayload = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      caloriesPer100g: Number(calories),
      proteinPer100g: Number(protein) || 0,
      carbsPer100g: Number(carbs) || 0,
      fatsPer100g: Number(fats) || 0,
    };

    /* 1️⃣ SAVE TO FIRESTORE */
    await addDoc(collection(db, "users", uid, "customFoods"), {
      ...foodPayload,
      source: params.source || "custom",
      createdAt: Timestamp.now(),
    });

    /* 2️⃣ MERGE INTO IN-MEMORY FOOD LIBRARY */
    await addFoodToLibraryIfMissing(foodPayload);


    /* 3️⃣ AUTO-SELECT IN ADD MEAL */
    router.replace({
      pathname: "/add-meal",
      params: {
        scannedFood: JSON.stringify(foodPayload),
      },
    });
  };

  /* ================= UI ================= */

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
