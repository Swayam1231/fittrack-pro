/**
 * Food Prediction Service
 * Main API for predicting food from images
 */

import * as tf from "@tensorflow/tfjs";
import {
  formatFoodLabel,
  getFoodLabels,
  loadFoodModel,
} from "./customFoodModel";
import { preprocessImage } from "./imagePreprocessor";

export type PredictionResult = {
  label: string; // Raw label: "butter_chicken"
  displayName: string; // Formatted: "Butter Chicken"
  confidence: number; // 0-1
  classIndex: number; // Index in labels array
};

/**
 * Predict food from an image
 * @param imageUri - Local file URI of the image
 * @param topK - Number of top predictions to return
 * @returns Array of predictions sorted by confidence
 */
export async function predictFood(
  imageUri: string,
  topK: number = 5,
): Promise<PredictionResult[]> {
  try {
    console.log("🔮 Starting food prediction...");

    // Step 1: Load model
    const model = await loadFoodModel();

    // Step 2: Preprocess image
    const inputTensor = await preprocessImage(imageUri);

    console.log("🧠 Running model inference...");

    // Step 3: Run prediction
    const prediction = model.predict(inputTensor) as tf.Tensor;

    // Step 4: Get probabilities (prediction output is already softmax from model)
    const probabilities = prediction;

    // Step 5: Get top K predictions manually
    const probabilitiesData = await probabilities.data();
    const allPredictions = Array.from(probabilitiesData)
      .map((confidence, index) => ({
        confidence,
        classIndex: index,
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const topKPredictions = allPredictions.slice(0, topK);

    // Step 6: Format results
    const labels = getFoodLabels();
    const results: PredictionResult[] = topKPredictions.map((prediction) => {
      const label = labels[prediction.classIndex];
      return {
        label,
        displayName: formatFoodLabel(label),
        confidence: prediction.confidence,
        classIndex: prediction.classIndex,
      };
    });

    console.log("✅ Prediction complete!");
    if (results.length > 0) {
      console.log(
        "   Top prediction:",
        results[0].displayName,
        `(${(results[0].confidence * 100).toFixed(1)}%)`,
      );
    }

    // Cleanup tensors
    inputTensor.dispose();
    prediction.dispose();
    probabilities.dispose();

    return results;
  } catch (error: unknown) {
    console.error("❌ Prediction error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to predict food: ${errorMessage}`);
  }
}

/**
 * Get single best prediction
 * @param imageUri - Local file URI
 * @returns Best prediction or null if confidence too low
 */
export async function predictFoodBest(
  imageUri: string,
  minConfidence: number = 0.3,
): Promise<PredictionResult | null> {
  const results = await predictFood(imageUri, 1);

  if (results.length === 0) {
    return null;
  }

  const best = results[0];

  if (best.confidence < minConfidence) {
    console.log(`⚠️ Low confidence: ${(best.confidence * 100).toFixed(1)}%`);
    return null;
  }

  return best;
}

/**
 * Check if prediction is confident enough
 * @param result - Prediction result
 * @param threshold - Minimum confidence (default 0.5)
 */
export function isConfidentPrediction(
  result: PredictionResult,
  threshold: number = 0.5,
): boolean {
  return result.confidence >= threshold;
}

/**
 * Get memory usage of TensorFlow
 */
export function getMemoryInfo() {
  // Memory monitoring not available in this configuration
  console.log("📊 TensorFlow is ready for inference");
  return { numTensors: 0, numBytes: 0, numDataBuffers: 0 };
}
