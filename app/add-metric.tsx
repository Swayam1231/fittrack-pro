import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { auth, db } from "../src/firebase/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Card } from "../src/components/Card";
import { useTheme } from "../src/context/ThemeContext"; // ✅ ADDED

export default function AddMetric() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;
  const { colors } = useTheme(); // ✅ ADDED

  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  const numericWeight = Number(weight);
  const numericBodyFat =
    bodyFat.trim() === "" ? undefined : Number(bodyFat);

  const isValid = numericWeight > 30;

  const saveMetric = async () => {
    if (!uid || !isValid) return;

    /* ---------- SAVE METRIC (EXISTING) ---------- */
    await addDoc(collection(db, "users", uid, "metrics"), {
      weight: numericWeight,
      bodyFat: numericBodyFat ?? null,
      createdAt: serverTimestamp(),
    });

    /* ---------- INIT GOAL WEIGHT (NEW, NO UI) ---------- */
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();

      // Only set goalWeight if it does NOT exist
      if (typeof data.goalWeight !== "number") {
        await updateDoc(userRef, {
          goalWeight: numericWeight,
        });
      }
    }

    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 12,
            color: colors.textPrimary, // ✅
          }}
        >
          Add Weight Entry
        </Text>

        <Card>
          <Text style={{ color: colors.textPrimary }}>
            Weight (kg)
          </Text>
          <TextInput
            keyboardType="numeric"
            placeholder="e.g. 72.5"
            placeholderTextColor={colors.textSecondary}
            value={weight}
            onChangeText={setWeight}
            style={{ color: colors.textPrimary }} // ✅
          />

          <Text
            style={{ marginTop: 12, color: colors.textPrimary }}
          >
            Body Fat % (optional)
          </Text>
          <TextInput
            keyboardType="numeric"
            placeholder="e.g. 18"
            placeholderTextColor={colors.textSecondary}
            value={bodyFat}
            onChangeText={setBodyFat}
            style={{ color: colors.textPrimary }} // ✅
          />
        </Card>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: colors.card, // ✅
          borderTopWidth: 1,
          borderColor: colors.border, // ✅
        }}
      >
        <Pressable
          onPress={saveMetric}
          disabled={!isValid}
          style={{
            backgroundColor: isValid
              ? colors.accent
              : colors.border, // ✅ (no muted token)
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Save Entry
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
