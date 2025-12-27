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
import { useTheme } from "../src/context/ThemeContext";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function EditGoalWeight() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // 🔥 KEY

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
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 12, // 🔥 FIX HEADER
          paddingBottom: 140 + insets.bottom, // 🔥 FIX FOOTER
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 16,
            color: colors.textPrimary,
          }}
        >
          Edit Goal Weight
        </Text>

        <Card>
          <Text
            style={{
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            Current Weight
          </Text>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
            }}
          >
            {currentWeight ? `${currentWeight} kg` : "—"}
          </Text>

          <Text
            style={{
              color: colors.textSecondary,
              marginTop: 16,
              marginBottom: 4,
            }}
          >
            Goal Weight
          </Text>

          <TextInput
            keyboardType="numeric"
            placeholder="Enter target weight"
            placeholderTextColor={colors.textSecondary}
            value={goalWeight}
            onChangeText={setGoalWeight}
            style={{ color: colors.textPrimary }}
          />

          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 8,
            }}
          >
            This weight will be used to track your progress and milestones.
          </Text>
        </Card>
      </ScrollView>

      {/* FIXED FOOTER */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom, // 🔥 FIX NAV BAR
          padding: 16,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Pressable
          onPress={saveGoalWeight}
          disabled={saving}
          style={{
            backgroundColor: saving
              ? colors.border
              : colors.accent,
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
    </SafeAreaView>
  );
}
