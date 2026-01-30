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
} from "react-native";

import { imageToTensor } from "../src/ml/imageToTensor";
import { predictFood } from "../src/ml/predictFood";

export default function AIConfirmMeal() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    label: string;
    confidence: number;
  } | null>(null);
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
      console.log("Running AI on image:", uri);

      setLoading(true);
      setError(null);

      const tensor = await imageToTensor(uri);
      const prediction = await predictFood(tensor);

      console.log("Prediction:", prediction);

      setResult(prediction);
      setLoading(false);
    } catch (e) {
      console.error("AI error:", e);
      setError(String(e));
      setLoading(false);
      Alert.alert("AI Error", String(e));
    }
  }

  function onUseThis() {
    if (!result) return;

    router.replace({
      pathname: "/add-meal",
      params: {
        foodName: result.label,
      },
    });
  }

  return (
    <View style={styles.container}>
      {imageUri && (
        <Image
          source={{ uri: imageUri as string }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.bottom}>
        {loading && (
          <>
            <ActivityIndicator size="large" />
            <Text style={styles.text}>Analyzing food...</Text>
          </>
        )}

        {!loading && error && (
          <>
            <Text style={styles.error}>AI Error:</Text>
            <Text style={styles.error}>{error}</Text>
          </>
        )}

        {!loading && !error && result && (
          <>
            <Text style={styles.detected}>Detected:</Text>
            <Text style={styles.label}>
              {result.label.replace(/_/g, " ")}
            </Text>
            <Text style={styles.confidence}>
              Confidence: {(result.confidence * 100).toFixed(2)}%
            </Text>

            <Pressable style={styles.button} onPress={onUseThis}>
              <Text style={styles.buttonText}>Use This</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    flex: 1,
    width: "100%",
  },
  bottom: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
  detected: {
    fontSize: 18,
    color: "#666",
  },
  label: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 8,
    textAlign: "center",
  },
  confidence: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
});
