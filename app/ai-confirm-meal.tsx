import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";
import { FoodLibraryItem } from "../src/data/foodLibrary";

const AI_ENDPOINT = "https://us-central1-YOUR_PROJECT.cloudfunctions.net/aiFoodDetect";

export default function AIConfirmMeal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string }>();

  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!params.imageUri) return;

    const runAI = async () => {
      try {
        setLoading(true);
        const base64 = await FileSystem.readAsStringAsync(params.imageUri!, { encoding: "base64" });


        const res = await fetch(AI_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        const data = await res.json();
        setFoodName(data.name || "");
        setCalories(String(data.caloriesPer100g || ""));
      } catch {
        Alert.alert("AI failed");
      } finally {
        setLoading(false);
      }
    };

    runAI();
  }, [params.imageUri]);

  const confirm = () => {
    if (!foodName || !calories) {
      Alert.alert("Fill details");
      return;
    }

    const normalizedName = foodName.trim();

const food: FoodLibraryItem = {
  id: `ai_${Date.now()}`,
  name: normalizedName,
  searchText: normalizedName.toLowerCase(), // ✅ REQUIRED FIELD
  caloriesPer100g: Number(calories),
  proteinPer100g: 0,
  carbsPer100g: 0,
  fatsPer100g: 0,
};



    router.replace({
      pathname: "/add-meal",
      params: { scannedFood: JSON.stringify(food) },
    });
  };

  return (
    <View style={{ padding: 16 }}>
      {params.imageUri && <Image source={{ uri: params.imageUri }} style={{ height: 200 }} />}
      {loading && <ActivityIndicator />}

      <TextInput placeholder="Food name" value={foodName} onChangeText={setFoodName} />
      <TextInput placeholder="Calories per 100g" value={calories} onChangeText={setCalories} keyboardType="numeric" />

      <TouchableOpacity onPress={confirm}>
        <Text>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
}
