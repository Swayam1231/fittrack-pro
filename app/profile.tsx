import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { auth, db } from "../src/firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { calculateTargets } from "../src/utils/calculateTargets";
import { Card } from "../src/components/Card";
import { SegmentedControl } from "../src/components/SegmentedControl";

/* ------------------ TYPES ------------------ */
type Gender = "male" | "female";
type Goal = "cut" | "maintain" | "bulk";
type Activity =
  | "sedentary"
  | "light"
  | "moderate"
  | "high"
  | "athlete";

/* ------------------ COMPONENT ------------------ */
export default function Profile() {
  const router = useRouter();

  /* -------- AUTH GUARD (CRITICAL FIX) -------- */
  const user = auth.currentUser;

  if (!user) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16 }}>Loading user…</Text>
      </View>
    );
  }

  const uid = user.uid;

  /* ------------------ STATE ------------------ */
  const [gender, setGender] = useState<Gender | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);

  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  /* ------------------ PARSED VALUES ------------------ */
  const numericAge = Number(age);
  const numericHeight = Number(height);
  const numericWeight = Number(weight);
  const numericBodyFat =
    bodyFat.trim() === "" ? undefined : Number(bodyFat);

  /* ------------------ VALIDATION ------------------ */
  const isValid =
    gender !== null &&
    goal !== null &&
    activity !== null &&
    numericAge >= 13 &&
    numericHeight >= 120 &&
    numericWeight >= 30;

  /* ------------------ LIVE TARGET PREVIEW ------------------ */
  const previewTargets = useMemo(() => {
    if (!isValid) return null;

    return calculateTargets({
      gender,
      age: numericAge,
      height: numericHeight,
      weight: numericWeight,
      bodyFat: numericBodyFat,
      goal,
      activityLevel: activity,
    });
  }, [
    isValid,
    gender,
    goal,
    activity,
    numericAge,
    numericHeight,
    numericWeight,
    numericBodyFat,
  ]);

  /* ------------------ SAVE (FIXED) ------------------ */
  const saveProfile = async () => {
    console.log("SAVE ATTEMPT", {
      uid,
      gender,
      goal,
      activity,
      numericAge,
      numericHeight,
      numericWeight,
      isValid,
    });

    if (!isValid || !previewTargets) {
      console.log("Profile invalid, save blocked");
      return;
    }

    try {
      await setDoc(doc(db, "users", uid), {
        gender,
        age: numericAge,
        height: numericHeight,
        weight: numericWeight,
        bodyFat: numericBodyFat ?? null,
        goal,
        activityLevel: activity,
        targets: previewTargets,
        updatedAt: serverTimestamp(),
      });

      console.log("Profile saved successfully");
      router.back();
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      >
        {/* -------- PERSONAL DETAILS -------- */}
        <Card>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
            Personal Details
          </Text>

          <Text>Gender *</Text>
          <SegmentedControl
            options={[
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
            ]}
            value={gender}
            onChange={setGender}
          />

          <Text style={{ marginTop: 12 }}>Age *</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="Years"
            value={age}
            onChangeText={setAge}
          />

          <Text style={{ marginTop: 12 }}>Height (cm) *</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="cm"
            value={height}
            onChangeText={setHeight}
          />

          <Text style={{ marginTop: 12 }}>Weight (kg) *</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="kg"
            value={weight}
            onChangeText={setWeight}
          />

          <Text style={{ marginTop: 12 }}>
            Body Fat % (optional)
          </Text>
          <TextInput
            keyboardType="numeric"
            placeholder="%"
            value={bodyFat}
            onChangeText={setBodyFat}
          />
        </Card>

        {/* -------- GOAL -------- */}
        <Card>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
            Fitness Goal *
          </Text>

          <SegmentedControl
            options={[
              { label: "Cut", value: "cut" },
              { label: "Maintain", value: "maintain" },
              { label: "Bulk", value: "bulk" },
            ]}
            value={goal}
            onChange={setGoal}
          />
        </Card>

        {/* -------- ACTIVITY -------- */}
        <Card>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
            Activity Level *
          </Text>

          {[
            { label: "Sedentary", desc: "Little or no exercise", value: "sedentary" },
            { label: "Light", desc: "1–3 workouts/week", value: "light" },
            { label: "Moderate", desc: "3–5 workouts/week", value: "moderate" },
            { label: "High", desc: "6–7 workouts/week", value: "high" },
            { label: "Athlete", desc: "Intense or twice daily", value: "athlete" },
          ].map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setActivity(item.value as Activity)}
              style={{
                padding: 12,
                borderRadius: 10,
                marginBottom: 8,
                backgroundColor:
                  activity === item.value ? "#DBEAFE" : "#F3F4F6",
              }}
            >
              <Text style={{ fontWeight: "600" }}>{item.label}</Text>
              <Text style={{ color: "#555" }}>{item.desc}</Text>
            </Pressable>
          ))}
        </Card>

        {/* -------- TARGET PREVIEW -------- */}
        {previewTargets && (
          <Card>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
              Daily Targets
            </Text>

            <Text>Calories: {previewTargets.calories} kcal</Text>
            <Text>Protein: {previewTargets.protein} g</Text>
            <Text>Carbs: {previewTargets.carbs} g</Text>
            <Text>Fats: {previewTargets.fats} g</Text>
          </Card>
        )}

        {/* -------- VALIDATION FEEDBACK -------- */}
        {!isValid && (
          <Text style={{ color: "#DC2626", marginTop: 8 }}>
            Please complete all required fields (*)
          </Text>
        )}
      </ScrollView>

      {/* -------- SAVE BUTTON -------- */}
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
          onPress={saveProfile}
          disabled={!isValid}
          style={{
            backgroundColor: isValid ? "#2563EB" : "#9CA3AF",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Save & Update Targets
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
