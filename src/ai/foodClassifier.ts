import ImageLabeling from "react-native-mlkit-image-labeling";

export type DetectedFood = {
  label: string;
  confidence: number;
};

export async function classifyFood(imageUri: string): Promise<DetectedFood[]> {
  const labels = await ImageLabeling.label(imageUri, {
    confidenceThreshold: 0.5,
  });

  return labels.map(l => ({
    label: l.text.toLowerCase(),
    confidence: l.confidence,
  }));
}
