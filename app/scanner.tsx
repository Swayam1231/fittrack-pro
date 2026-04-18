import { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button, ActivityIndicator, Pressable, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useTheme } from "../src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 32 }]}>
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        </View>
        <Text style={{ textAlign: "center", color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginBottom: 12 }}>
          Camera Access Required
        </Text>
        <Text style={{ textAlign: "center", color: colors.textSecondary, marginBottom: 32 }}>
          We need your permission to use the camera so you can scan food barcodes quickly.
        </Text>
        <Pressable 
          onPress={requestPermission}
          style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 16, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Grant Permission</Text>
        </Pressable>
        <Pressable 
          onPress={() => router.back()}
          style={{ padding: 16, borderRadius: 16, alignItems: "center", marginTop: 8 }}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 16 }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}.json`);
      const json = await res.json();

      if (json.status === 1 && json.product) {
        const product = json.product;
        const name = product.product_name || "Unknown Food";
        const nutriments = product.nutriments || {};
        
        const calories = nutriments["energy-kcal_100g"] || 0;
        const protein = nutriments["proteins_100g"] || 0;
        const carbs = nutriments["carbohydrates_100g"] || 0;
        const fats = nutriments["fat_100g"] || 0;

        // Route back to add-meal with data
        router.replace({
          pathname: "/add-meal",
          params: {
            scannedName: name,
            scannedCal: calories,
            scannedPro: protein,
            scannedCarb: carbs,
            scannedFat: fats,
          }
        });
      } else {
        Alert.alert("Not Found", "This barcode is not in our food database yet.", [
          { text: "Try Again", onPress: () => { setScanned(false); setLoading(false); } },
          { text: "Enter Manually", onPress: () => router.back() }
        ]);
      }
    } catch (e) {
      Alert.alert("Network Error", "Could not connect to the food database.", [
        { text: "Try Again", onPress: () => { setScanned(false); setLoading(false); } }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        facing="back"
      />
      <View style={styles.overlay}>
        <View style={styles.header}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Scan Barcode</Text>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
               <Ionicons name="close" size={24} color="#000" />
            </Pressable>
        </View>

        <View style={styles.targetWrapper}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: "#fff", marginTop: 12, fontWeight: "600", fontSize: 16 }}>Fetching Nutrition...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  targetWrapper: {
    width: 250,
    height: 150,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  loadingBox: {
    position: "absolute",
    bottom: 120,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    borderRadius: 16,
  },
});
