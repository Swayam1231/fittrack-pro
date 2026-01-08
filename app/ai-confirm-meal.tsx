import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { classifyFood } from "../src/ai/foodClassifier";
import { matchFoodLabel } from "../src/ai/foodMatcher";
import { FoodLibraryItem } from "../src/data/foodLibrary";
import { useTheme } from "../src/context/ThemeContext";

export default function AIConfirmMeal() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ imageUri?: string }>();

  const [loading, setLoading] = useState(true);
  const [matched, setMatched] = useState<FoodLibraryItem | null>(null);
  const [fallbackName, setFallbackName] = useState<string | null>(null);

  useEffect(() => {
    if (!params.imageUri) return;

    const run = async () => {
      try {
        setLoading(true);

        const labels = await classifyFood(params.imageUri!);

        // Try to match against your food library
        for (const l of labels) {
          const food = matchFoodLabel(l.label);
          if (food) {
            setMatched(food);
            setLoading(false);
            return;
          }
        }

        // If nothing matched, use the top label as fallback
        if (labels.length > 0) {
          setFallbackName(labels[0].label);
        }

        setLoading(false);
      } catch (e) {
        setLoading(false);
        Alert.alert("AI failed", "Could not analyze image.");
      }
    };

    run();
  }, [params.imageUri]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
          Analyzing image...
        </Text>
      </View>
    );
  }

  const goToAdd = () => {
    if (matched) {
      // ✅ Send full object (your Add Meal already supports this)
      router.replace({
        pathname: "../add-meal",
        params: {
          scannedFood: JSON.stringify(matched),
        },
      });
    } else if (fallbackName) {
      // Create a temporary food object so Add Meal can still open
      const tempFood: FoodLibraryItem = {
        id: "ai_temp_" + Date.now(),
        name: fallbackName,
        searchText: fallbackName.toLowerCase(),
        caloriesPer100g: 100,
        proteinPer100g: 0,
        carbsPer100g: 0,
        fatsPer100g: 0,
      };

      router.replace({
        pathname: "../add-meal",
        params: {
          scannedFood: JSON.stringify(tempFood),
        },
      });
    } else {
      Alert.alert("Could not recognize food");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      {params.imageUri && (
        <Image
          source={{ uri: params.imageUri }}
          style={{ height: 220, borderRadius: 12, marginBottom: 16 }}
        />
      )}

      {matched ? (
        <>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.textPrimary,
            }}
          >
            {matched.name}
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
            {matched.caloriesPer100g} kcal / 100g
          </Text>
        </>
      ) : fallbackName ? (
        <>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.textPrimary,
            }}
          >
            Detected: {fallbackName}
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
            Could not find exact match. You can edit it manually.
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.textPrimary }}>
          Could not recognize food
        </Text>
      )}

      <TouchableOpacity
        onPress={goToAdd}
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          backgroundColor: colors.accent,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          Use This
        </Text>
      </TouchableOpacity>
    </View>
  );
}
