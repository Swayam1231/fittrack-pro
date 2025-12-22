import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/* ---- CALCULATION ENGINE (EXISTING FILE) ---- */
import { calculateTargets } from "../utils/calculateTargets";

/* ---- TYPES ---- */
type Gender = "Male" | "Female";
type FitnessLevel = "Beginner" | "Intermediate" | "Advanced";
type PrimaryGoal = "Fat Loss" | "Maintenance" | "Muscle Gain";

/* ---- MAPPERS (APP → ENGINE) ---- */
function mapGender(g: Gender) {
  return g === "Male" ? "male" : "female";
}

function mapGoal(goal: PrimaryGoal) {
  switch (goal) {
    case "Fat Loss":
      return "cut";
    case "Muscle Gain":
      return "bulk";
    default:
      return "maintain";
  }
}

function mapActivity(level: FitnessLevel) {
  switch (level) {
    case "Beginner":
      return "light";
    case "Advanced":
      return "high";
    default:
      return "moderate";
  }
}

export default function EditProfileModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  /* ---- STATE ---- */
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [fitnessLevel, setFitnessLevel] =
    useState<FitnessLevel>("Intermediate");
  const [primaryGoal, setPrimaryGoal] =
    useState<PrimaryGoal>("Fat Loss");

  /* ---- LOAD PROFILE ---- */
  useEffect(() => {
    if (!visible) return;

    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return;

      const d = snap.data();
      setName(d.name ?? "");
      setGender(d.gender ?? "Male");
      setAge(String(d.age ?? ""));
      setHeight(String(d.height ?? ""));
      setWeight(String(d.weight ?? ""));
      setBodyFat(d.bodyFat ? String(d.bodyFat) : "");
      setFitnessLevel(d.fitnessLevel ?? "Intermediate");
      setPrimaryGoal(d.primaryGoal ?? "Fat Loss");
    })();
  }, [visible]);

  /* ---- SAVE + RECALCULATE ---- */
  const saveProfile = async () => {
    if (!name || !age || !height || !weight) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }

    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);
    const bfNum = bodyFat ? Number(bodyFat) : undefined;

    if (bfNum && (bfNum < 5 || bfNum > 50)) {
      Alert.alert("Invalid Body Fat %", "Enter a value between 5–50%");
      return;
    }
    

    /* ---- CALL EXISTING ENGINE ---- */
    const targets = calculateTargets({
      gender: mapGender(gender),
      age: ageNum,
      height: heightNum,
      weight: weightNum,
      bodyFat: bfNum,
      goal: mapGoal(primaryGoal),
      activityLevel: mapActivity(fitnessLevel),
    });

    await updateDoc(doc(db, "users", uid), {
      name,
      gender,
      age: ageNum,
      height: heightNum,
      weight: weightNum,
      bodyFat: bfNum ?? null,
      fitnessLevel,
      primaryGoal,

      targets: {
        calories: targets.calories,
        protein: targets.protein,
        carbs: targets.carbs,
        fats: targets.fats,
      },
    });

    onClose();
    
  };

  /* ---- UI ---- */
  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 20 }}>
          Edit Core Profile
        </Text>

        <Text style={labelStyle}>Name *</Text>
        <TextInput value={name} onChangeText={setName} style={inputStyle} />

        <Segment
          title="Gender *"
          options={["Male", "Female"]}
          value={gender}
          onChange={setGender}
        />

        <Text style={labelStyle}>Age *</Text>
        <TextInput
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          style={inputStyle}
        />

        <Text style={labelStyle}>Height (cm) *</Text>
        <TextInput
          value={height}
          onChangeText={setHeight}
          keyboardType="number-pad"
          style={inputStyle}
        />

        <Text style={labelStyle}>Weight (kg) *</Text>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          keyboardType="number-pad"
          style={inputStyle}
        />

        <Text style={labelStyle}>Body Fat % (optional)</Text>
        <TextInput
          value={bodyFat}
          onChangeText={setBodyFat}
          keyboardType="decimal-pad"
          placeholder="e.g. 22"
          style={inputStyle}
        />

        <Segment
          title="Fitness Level *"
          options={["Beginner", "Intermediate", "Advanced"]}
          value={fitnessLevel}
          onChange={setFitnessLevel}
        />

        <Segment
          title="Primary Goal *"
          options={["Fat Loss", "Maintenance", "Muscle Gain"]}
          value={primaryGoal}
          onChange={setPrimaryGoal}
        />

        <Pressable onPress={saveProfile} style={saveBtn}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            Save & Recalculate
          </Text>
        </Pressable>

        <Pressable onPress={onClose} style={{ marginTop: 12 }}>
          <Text style={{ textAlign: "center", color: "#6B7280" }}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

/* ---- REUSABLE SEGMENT ---- */
function Segment({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: any) => void;
}) {
  return (
    <>
      <Text style={labelStyle}>{title}</Text>
      <View style={{ flexDirection: "row", borderRadius: 12, overflow: "hidden" }}>
        {options.map((o) => (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              flex: 1,
              paddingVertical: 12,
              backgroundColor: value === o ? "#2563EB" : "#E5E7EB",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: value === o ? "#fff" : "#111827",
                fontWeight: "600",
              }}
            >
              {o}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
  
}

/* ---- STYLES ---- */
const labelStyle = {
  fontWeight: "600" as const,
  marginTop: 16,
  marginBottom: 6,
};

const inputStyle = {
  backgroundColor: "#F9FAFB",
  borderRadius: 12,
  padding: 14,
};

const saveBtn = {
  backgroundColor: "#2563EB",
  padding: 16,
  borderRadius: 14,
  alignItems: "center" as const,
  marginTop: 32,
};
