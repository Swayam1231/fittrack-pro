import ImageLabeler from "@react-native-ml-kit/image-labeling";

export type DetectedFood = {
  label: string;
  confidence: number;
};

export async function classifyFood(imageUri: string): Promise<DetectedFood[]> {
  const labels = await ImageLabeler.label(imageUri);

  return labels.map(l => ({
    label: l.text.toLowerCase(),
    confidence: l.confidence,
  }));
}
