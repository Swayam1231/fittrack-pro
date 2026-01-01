import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/context/ThemeContext";
import { FoodLibraryItem } from "../src/data/foodLibrary";

/* ================= TYPES ================= */

type RouteParams = {
  imageUri?: string;
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 16 },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
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
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  note: {
    fontSize: 12,
    marginTop: 8,
  },
});

/* ================= COMPONENT ================= */

export default function AIConfirmMeal() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();

  const [foodName, setFoodName] = useState("");
  const [caloriesPer100g, setCaloriesPer100g] = useState("");
  const [grams, setGrams] = useState("100");

  /* ================= CONFIRM ================= */

  const confirmMeal = () => {
    if (!foodName.trim()) {
      Alert.alert("Food name is required");
      return;
    }

    const calories = Number(caloriesPer100g);
    if (!calories || calories <= 0) {
      Alert.alert("Calories must be greater than 0");
      return;
    }

    const foodPayload: FoodLibraryItem = {
      id: `ai_${Date.now()}`,
      name: foodName.trim(),
      caloriesPer100g: calories,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatsPer100g: 0,
      source: "custom",
    };

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
      <ScrollView contentContainerStyle={styles.container}>
        {params.imageUri && (
          <Image
            source={{ uri: params.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Confirm Meal Details
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
          placeholder="Food name (e.g. Chicken Curry)"
          placeholderTextColor={colors.textSecondary}
          value={foodName}
          onChangeText={setFoodName}
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
          value={caloriesPer100g}
          onChangeText={setCaloriesPer100g}
        />

        {/* GRAMS */}
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
          placeholder="Portion size (grams)"
          placeholderTextColor={colors.textSecondary}
          value={grams}
          onChangeText={setGrams}
        />

        <TouchableOpacity
          onPress={confirmMeal}
          style={[
            styles.button,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text style={styles.buttonText}>
            Confirm & Add Meal
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.note,
            { color: colors.textSecondary },
          ]}
        >
          Calories are estimated manually and may not be accurate.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
