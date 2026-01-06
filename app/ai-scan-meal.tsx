import { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

export default function AIScanMeal() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setPhotoUri(photo.uri);
    setLoading(false);
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission}><Text>Allow</Text></TouchableOpacity>
      </View>
    );
  }

  if (photoUri) {
    return (
      <View style={{ flex: 1 }}>
        <Image source={{ uri: photoUri }} style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => router.push({ pathname: "../ai-confirm-meal", params: { imageUri: photoUri } })}
        >
          <Text style={{ textAlign: "center", padding: 20 }}>Use Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} />
      <TouchableOpacity onPress={takePhoto}>
        <Text style={{ textAlign: "center", padding: 20 }}>📸 Capture</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator />}
    </View>
  );
}
