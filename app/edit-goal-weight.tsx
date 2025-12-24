import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { auth, db } from "../src/firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Card } from "../src/components/Card";

export default function EditGoalWeight() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [goalWeight, setGoalWeight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;

    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return;

      const data = snap.data();
      setCurrentWeight(data.weight ?? null);
      setGoalWeight(
        typeof data.goalWeight === "number"
          ? String(data.goalWeight)
          : ""
      );
    })();
  }, [uid]);

  const saveGoalWeight = async () => {
    const numericGoal = Number(goalWeight);

    if (!numericGoal || numericGoal < 30 || numericGoal > 300) {
      Alert.alert(
        "Invalid weight",
        "Please enter a valid goal weight."
      );
      return;
    }

    if (!uid) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "users", uid), {
  goalWeight: numericGoal,
  goalStartWeight: currentWeight,
});
    

      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to update goal weight.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
          Edit Goal Weight
        </Text>

        <Card>
          <Text style={{ color: "#6B7280", marginBottom: 4 }}>
            Current Weight
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            {currentWeight ? `${currentWeight} kg` : "—"}
          </Text>

          <Text
            style={{
              color: "#6B7280",
              marginTop: 16,
              marginBottom: 4,
            }}
          >
            Goal Weight
          </Text>
          <TextInput
            keyboardType="numeric"
            placeholder="Enter target weight"
            value={goalWeight}
            onChangeText={setGoalWeight}
          />

          <Text
            style={{
              fontSize: 12,
              color: "#6B7280",
              marginTop: 8,
            }}
          >
            This weight will be used to track your progress and milestones.
          </Text>
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
          onPress={saveGoalWeight}
          disabled={saving}
          style={{
            backgroundColor: saving ? "#9CA3AF" : "#2563EB",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {saving ? "Saving..." : "Save Goal Weight"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
