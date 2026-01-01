import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useTheme } from "../src/context/ThemeContext";

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelText: {
    color: "#ccc",
    marginTop: 8,
  },
  preview: {
    flex: 1,
  },
});

/* ================= COMPONENT ================= */

export default function AIScanMeal() {
  const router = useRouter();
  const { colors } = useTheme();
  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ================= PERMISSION ================= */

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  /* ================= CAPTURE ================= */

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
      skipProcessing: true,
    });

    setPhotoUri(photo.uri);
    setLoading(false);
  };

  /* ================= UI STATES ================= */

  if (!permission?.granted) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.textPrimary }}>
          Camera permission is required
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={[
            styles.button,
            { backgroundColor: colors.accent, marginTop: 12 },
          ]}
        >
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ================= PREVIEW MODE ================= */

  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: photoUri }}
          style={styles.preview}
          resizeMode="contain"
        />

        <View style={styles.overlay}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "../ai-confirm-meal",
                params: { imageUri: photoUri },
              })
            }
            style={[
              styles.button,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text style={styles.buttonText}>
              Use Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPhotoUri(null)}
          >
            <Text style={styles.cancelText}>
              Retake
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={{ position: "absolute", top: "50%" }}
          />
        )}
      </View>
    );
  }

  /* ================= CAMERA MODE ================= */

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
      />

      <View style={styles.overlay}>
        <TouchableOpacity
          onPress={takePhoto}
          style={[
            styles.button,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text style={styles.buttonText}>
            📸 Capture Meal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={{ position: "absolute", top: "50%" }}
        />
      )}
    </View>
  );
}
