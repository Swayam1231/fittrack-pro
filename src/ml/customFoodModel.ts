/**
 * Custom Food Model for Indian Foods
 * Uses TensorFlow.js with React Native
 */

import * as tf from "@tensorflow/tfjs";

import { loadGraphModel } from "@tensorflow/tfjs-converter";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";

import { FOOD_LABELS } from "./foodLabels";

let model: tf.GraphModel | null = null;
let tfReady = false;
let tfInitializing: Promise<void> | null = null;

/**
 * Initialize TensorFlow.js for React Native
 * Must be called before any predictions
 */
export async function initTensorFlow() {
  if (tfReady) {
    return;
  }
  if (tfInitializing) {
    return tfInitializing;
  }

  tfInitializing = (async () => {
    try {
      console.log("🔧 Initializing TensorFlow.js...");
      await tf.ready();
      tfReady = true;
      console.log("✅ TensorFlow.js ready!");
      console.log("   Backend:", tf.getBackend());
    } catch (error: unknown) {
      console.error("❌ TensorFlow initialization failed:", error);
      throw error;
    } finally {
      tfInitializing = null;
    }
  })();

  return tfInitializing;
}

/**
 * Load the custom food recognition model
 * Model files should be in assets/food-model/
 */
export async function loadFoodModel() {
  if (model) {
    console.log("✅ Model already loaded");
    return model;
  }

  await initTensorFlow();

  try {
    console.log("📦 Loading food model...");

    // Load model from bundled assets
    // Make sure model files are in: assets/food-model/
    const modelJson = require("../../assets/food-model/model.json");
    const modelWeights = [
      require("../../assets/food-model/group1-shard1of3.bin"), // eslint-disable-line
      require("../../assets/food-model/group1-shard2of3.bin"), // eslint-disable-line
      require("../../assets/food-model/group1-shard3of3.bin"), // eslint-disable-line
    ];

    model = await loadGraphModel(bundleResourceIO(modelJson, modelWeights));

    console.log("✅ Model loaded successfully!");
    console.log("   Input shape:", model.inputs[0].shape);
    console.log("   Output shape:", model.outputs[0].shape);

    // Warm up the model with a dummy prediction
    const dummyInput = tf.zeros([1, 224, 224, 3]);
    const warmup = model.predict(dummyInput) as tf.Tensor;
    await warmup.data();
    dummyInput.dispose();
    warmup.dispose();

    console.log("✅ Model warmed up");

    return model;
  } catch (error: unknown) {
    console.error("❌ Model loading failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load model: ${errorMessage}`);
  }
}

/**
 * Convert label to human-readable format
 * e.g., "butter_chicken" -> "Butter Chicken"
 */
export function formatFoodLabel(label: string): string {
  return label
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get food labels
 */
export function getFoodLabels(): string[] {
  return FOOD_LABELS;
}

/**
 * Dispose of the model and free memory
 */
export function disposeModel() {
  if (model) {
    model.dispose();
    model = null;
    console.log("🗑️ Model disposed");
  }
}
