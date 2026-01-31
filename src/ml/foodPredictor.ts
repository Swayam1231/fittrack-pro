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

    // Step 4: Apply softmax to get probabilities
    const probabilities = tf.softmax(prediction);

    // Step 5: Get top K predictions
    const { values, indices } = tf.topk(probabilities, topK);

    const [probabilityArray, indexArray] = await Promise.all([
      values.data(),
      indices.data(),
    ]);

    // Step 6: Format results
    const labels = getFoodLabels();
    const results: PredictionResult[] = [];

    for (let i = 0; i < topK; i++) {
      const classIndex = indexArray[i];
      const confidence = probabilityArray[i];
      const label = labels[classIndex];

      results.push({
        label,
        displayName: formatFoodLabel(label),
        confidence,
        classIndex,
      });
    }

    console.log("✅ Prediction complete!");
    console.log(
      "   Top prediction:",
      results[0].displayName,
      `(${(results[0].confidence * 100).toFixed(1)}%)`,
    );

    // Cleanup tensors
    inputTensor.dispose();
    prediction.dispose();
    probabilities.dispose();
    values.dispose();
    indices.dispose();

    return results;
  } catch (error) {
    console.error("❌ Prediction error:", error);
    throw new Error(`Failed to predict food: ${error.message}`);
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
  const memory = tf.memory();
  console.log("📊 TensorFlow Memory:");
  console.log("   Tensors:", memory.numTensors);
  console.log("   Bytes:", memory.numBytes);
  console.log("   Data buffers:", memory.numDataBuffers);
  return memory;
}
