import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/context/ThemeContext";

export default function AIScanMeal() {
  const router = useRouter();
  const { colors } = useTheme();

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!permission?.granted) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.textPrimary, marginBottom: 12 }}>
          Camera permission required
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: colors.accent }}>Allow</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setPhotoUri(photo.uri);
    setLoading(false);
  };

  if (photoUri) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Image source={{ uri: photoUri }} style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "../ai-confirm-meal",
              params: { imageUri: photoUri },
            })
          }
          style={{
            padding: 16,
            alignItems: "center",
            backgroundColor: colors.card,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
            Use Photo
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={takePhoto}
        style={{
          padding: 16,
          alignItems: "center",
          backgroundColor: colors.card,
        }}
      >
        <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
          📸 Capture
        </Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
    </View>
  );
}
