import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { predictFood, PredictionResult } from "../src/ml/foodPredictor";
import { matchFoodLabel } from "../src/ml/foodMatcher";
import { FoodLibraryItem } from "../src/data/foodLibrary";
import { useTheme } from "../src/context/ThemeContext";

export default function AIConfirmMeal() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [matchedFood, setMatchedFood] = useState<FoodLibraryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUri) {
      setError("No image provided");
      setLoading(false);
      return;
    }

    runAI(imageUri as string);
  }, [imageUri]);

  async function runAI(uri: string) {
    try {
      console.log("🚀 Running TensorFlow model on image:", uri);

      setLoading(true);
      setError(null);

      // Step 1: Run TensorFlow prediction
      const results = await predictFood(uri, 5); // Get top 5 predictions

      if (results.length === 0) {
        setError("No food detected in image. Try a clearer photo.");
        setLoading(false);
        return;
      }

      setPredictions(results);

      console.log("📋 Top predictions:");
      results.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.displayName} (${(r.confidence * 100).toFixed(1)}%)`);
      });

      // Step 2: Try to match top prediction to food library
      const topPrediction = results[0];
      
      // Only accept if confidence > 30%
      if (topPrediction.confidence < 0.3) {
        setError(
          `Low confidence (${(topPrediction.confidence * 100).toFixed(1)}%). Try a clearer photo.`
        );
        setLoading(false);
        return;
      }

      const matched = matchFoodLabel(topPrediction.label);

      if (!matched) {
        console.log("⚠️  No match in food library for:", topPrediction.displayName);
        // Still show predictions but no match
        setError(
          `Detected "${topPrediction.displayName}" but not in your food library. You can add it or search manually.`
        );
        setLoading(false);
        return;
      }

      console.log("✅ Matched to food library:", matched.name);
      setMatchedFood(matched);
      setLoading(false);
    } catch (e) {
      console.error("❌ AI error:", e);
      setError(String(e));
      setLoading(false);
      Alert.alert("AI Error", String(e));
    }
  }

  function useThisFood() {
    if (!matchedFood) return;

    // Navigate back to add-meal with the matched food pre-selected
    router.replace({
      pathname: "/add-meal",
      params: {
        scannedFood: JSON.stringify(matchedFood),
      },
    });
  }

  function searchManually(prediction: PredictionResult) {
    // Search for the predicted food name
    router.replace({
      pathname: "/add-meal",
      params: {
        searchQuery: prediction.displayName.toLowerCase(),
      },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* IMAGE PREVIEW */}
        {imageUri && (
          <Image
            source={{ uri: imageUri as string }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
          {/* LOADING STATE */}
          {loading && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
                Analyzing food with AI...
              </Text>
              <Text style={[styles.subText, { color: colors.textSecondary }]}>
                Using custom Indian food model
              </Text>
            </View>
          )}

          {/* ERROR/WARNING STATE */}
          {!loading && error && (
            <View>
              <Text style={[styles.errorTitle, { color: colors.danger }]}>
                ⚠️ Detection Issue
              </Text>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {error}
              </Text>

              {predictions.length > 0 && (
                <>
                  <Text
                    style={[styles.predictionsTitle, { color: colors.textPrimary }]}
                  >
                    AI Predictions:
                  </Text>
                  
                  {predictions.map((pred, idx) => (
                    <Pressable
                      key={idx}
                      style={[
                        styles.predictionButton,
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => searchManually(pred)}
                    >
                      <View style={styles.predictionRow}>
                        <Text style={{ color: colors.textPrimary, flex: 1 }}>
                          {idx + 1}. {pred.displayName}
                        </Text>
                        <View style={[styles.confidenceBadge, {
                          backgroundColor: pred.confidence > 0.7 
                            ? colors.accent 
                            : pred.confidence > 0.5 
                            ? '#F59E0B'
                            : colors.textSecondary
                        }]}>
                          <Text style={styles.confidenceText}>
                            {(pred.confidence * 100).toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </>
              )}

              <Pressable
                style={[styles.retryButton, { backgroundColor: colors.accent }]}
                onPress={() => router.back()}
              >
                <Text style={styles.buttonText}>📸 Try Another Photo</Text>
              </Pressable>
            </View>
          )}

          {/* SUCCESS STATE */}
          {!loading && !error && matchedFood && predictions.length > 0 && (
            <View>
              <Text style={[styles.successTitle, { color: colors.accent }]}>
                ✅ Food Detected!
              </Text>

              <Text style={[styles.foodName, { color: colors.textPrimary }]}>
                {matchedFood.name}
              </Text>

              <View style={styles.macroRow}>
                <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                  {matchedFood.caloriesPer100g} cal
                </Text>
                <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                  P: {matchedFood.proteinPer100g}g
                </Text>
                <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                  C: {matchedFood.carbsPer100g}g
                </Text>
                <Text style={[styles.macroText, { color: colors.textSecondary }]}>
                  F: {matchedFood.fatsPer100g}g
                </Text>
              </View>

              {/* Show AI confidence */}
              <View style={[styles.aiInfo, { backgroundColor: colors.background }]}>
                <Text style={[styles.aiInfoText, { color: colors.textSecondary }]}>
                  🤖 AI detected: {predictions[0].displayName}
                </Text>
                <Text style={[styles.aiInfoText, { color: colors.textSecondary }]}>
                  Confidence: {(predictions[0].confidence * 100).toFixed(1)}%
                </Text>
              </View>

              {/* Show other predictions */}
              {predictions.length > 1 && (
                <View style={styles.otherPredictions}>
                  <Text style={[styles.otherTitle, { color: colors.textSecondary }]}>
                    Other possibilities:
                  </Text>
                  {predictions.slice(1, 3).map((pred, idx) => (
                    <Pressable
                      key={idx}
                      style={styles.otherPredictionButton}
                      onPress={() => searchManually(pred)}
                    >
                      <Text style={{ color: colors.accent, fontSize: 12 }}>
                        {pred.displayName} ({(pred.confidence * 100).toFixed(0)}%)
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable
                style={[styles.useButton, { backgroundColor: colors.accent }]}
                onPress={useThisFood}
              >
                <Text style={styles.buttonText}>✨ Use This Food</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.back()}
              >
                <Text style={{ color: colors.textPrimary }}>
                  📸 Try Another Photo
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  image: {
    width: "100%",
    height: 300,
  },
  resultCard: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  centerContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  subText: {
    marginTop: 4,
    fontSize: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  predictionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  predictionButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  confidenceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  foodName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  macroText: {
    fontSize: 14,
  },
  aiInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  aiInfoText: {
    fontSize: 12,
    marginBottom: 4,
  },
  otherPredictions: {
    marginBottom: 16,
  },
  otherTitle: {
    fontSize: 12,
    marginBottom: 6,
  },
  otherPredictionButton: {
    marginBottom: 4,
  },
  useButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});