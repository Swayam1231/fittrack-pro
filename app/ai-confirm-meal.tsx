import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { classifyFood } from "../src/ai/foodClassifier";
import { matchFoodLabel } from "../src/ai/foodMatcher";
import { FoodLibraryItem } from "../src/data/foodLibrary";

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

        const labels = await classifyFood(params.imageUri!);

        if (!labels.length) {
          Alert.alert("Could not recognize food");
          return;
        }

        for (const l of labels) {
          const match = matchFoodLabel(l.label);
          if (match) {
            setFoodName(match.name);
            setCalories(String(match.caloriesPer100g));
            return;
          }
        }

        // fallback
        setFoodName(labels[0].label);
        setCalories("");
      } catch (e) {
        Alert.alert("On-device AI failed");
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
      searchText: normalizedName.toLowerCase(),
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
