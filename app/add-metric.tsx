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

export default function AddMetric() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;

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
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
          Add Weight Entry
        </Text>

        <Card>
          <Text>Weight (kg)</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="e.g. 72.5"
            value={weight}
            onChangeText={setWeight}
          />

          <Text style={{ marginTop: 12 }}>
            Body Fat % (optional)
          </Text>
          <TextInput
            keyboardType="numeric"
            placeholder="e.g. 18"
            value={bodyFat}
            onChangeText={setBodyFat}
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
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Pressable
          onPress={saveMetric}
          disabled={!isValid}
          style={{
            backgroundColor: isValid ? "#2563EB" : "#9CA3AF",
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
