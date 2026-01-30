import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AIScanMeal() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need camera permission</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || loading) return;

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo?.uri) {
        setLoading(false);
        return;
      }

      router.push({
        pathname: "/ai-confirm-meal",
        params: { imageUri: photo.uri },
      });
    } catch (e) {
      console.error("Camera error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <View style={styles.controls}>
        <Pressable style={styles.captureButton} onPress={takePicture}>
          <Text style={styles.captureText}>
            {loading ? "Processing..." : "Capture"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureText: {
    fontWeight: "bold",
  },
  text: { color: "white" },
  button: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  buttonText: { color: "white" },
});
