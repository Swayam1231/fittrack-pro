import ImageLabeling from "@react-native-ml-kit/image-labeling";

export type DetectedFood = {
  label: string;
  confidence: number;
};

export async function classifyFood(imageUri: string): Promise<DetectedFood[]> {
  try {
    console.log("🔍 Classifying image:", imageUri);

    const labels = await ImageLabeling.label(imageUri);

    console.log("📋 ML Kit labels:", labels);

    const detectedFoods: DetectedFood[] = labels.map((label) => ({
      label: label.text.toLowerCase().trim(),
      confidence: label.confidence,
    }));

    detectedFoods.sort((a, b) => b.confidence - a.confidence);

    console.log("✅ Detected foods:", detectedFoods);

    return detectedFoods;
  } catch (error: unknown) {
    console.error("❌ ML Kit classification error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to classify image: ${errorMessage}`);
  }
}

export async function classifyFoodTop(
  imageUri: string,
): Promise<DetectedFood | null> {
  const results = await classifyFood(imageUri);
  return results.length > 0 ? results[0] : null;
}

export function isMLKitAvailable(): boolean {
  try {
    return typeof ImageLabeling !== "undefined";
  } catch {
    return false;
  }
}
