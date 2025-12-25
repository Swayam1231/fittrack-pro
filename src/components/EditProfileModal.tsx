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
import { useTheme } from "../context/ThemeContext"; // ✅ added

/* ---- CALCULATION ENGINE ---- */
import { calculateTargets } from "../utils/calculateTargets";

/* ---- TYPES ---- */
type Gender = "Male" | "Female";
type FitnessLevel = "Beginner" | "Intermediate" | "Advanced";
type PrimaryGoal = "Fat Loss" | "Maintenance" | "Muscle Gain";

/* ---- MAPPERS ---- */
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
  const { colors } = useTheme(); // ✅ added

  /* ---- STATE (HOOKS MUST ALWAYS RUN) ---- */
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
    if (!visible || !uid) return;

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
  }, [visible, uid]);

  /* ---- EARLY RETURN AFTER HOOKS ---- */
  if (!uid) return null;

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

  /* ---- UI (UNCHANGED) ---- */
  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 20,
            color: colors.textPrimary, // ✅
          }}
        >
          Edit Core Profile
        </Text>

        <Text style={[labelStyle, { color: colors.textPrimary }]}>
          Name *
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[
            inputStyle,
            { backgroundColor: colors.background }, // ✅
          ]}
        />

        <Segment
          title="Gender *"
          options={["Male", "Female"]}
          value={gender}
          onChange={setGender}
        />

        <Text style={[labelStyle, { color: colors.textPrimary }]}>
          Age *
        </Text>
        <TextInput
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          style={[
            inputStyle,
            { backgroundColor: colors.background }, // ✅
          ]}
        />

        <Text style={[labelStyle, { color: colors.textPrimary }]}>
          Height (cm) *
        </Text>
        <TextInput
          value={height}
          onChangeText={setHeight}
          keyboardType="number-pad"
          style={[
            inputStyle,
            { backgroundColor: colors.background }, // ✅
          ]}
        />

        <Text style={[labelStyle, { color: colors.textPrimary }]}>
          Weight (kg) *
        </Text>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          keyboardType="number-pad"
          style={[
            inputStyle,
            { backgroundColor: colors.background }, // ✅
          ]}
        />

        <Text style={[labelStyle, { color: colors.textPrimary }]}>
          Body Fat % (optional)
        </Text>
        <TextInput
          value={bodyFat}
          onChangeText={setBodyFat}
          keyboardType="decimal-pad"
          placeholder="e.g. 22"
          style={[
            inputStyle,
            { backgroundColor: colors.background }, // ✅
          ]}
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

        <Pressable
          onPress={saveProfile}
          style={[saveBtn, { backgroundColor: colors.accent }]} // ✅
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            Save & Recalculate
          </Text>
        </Pressable>

        <Pressable onPress={onClose} style={{ marginTop: 12 }}>
          <Text
            style={{
              textAlign: "center",
              color: colors.textSecondary, // ✅
            }}
          >
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

/* ---- SEGMENT COMPONENT ---- */
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
  const { colors } = useTheme(); // ✅ added

  return (
    <>
      <Text style={[labelStyle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", borderRadius: 12, overflow: "hidden" }}>
        {options.map((o) => (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              flex: 1,
              paddingVertical: 12,
              backgroundColor:
                value === o ? colors.accent : colors.border, // ✅
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: value === o ? "#fff" : colors.textPrimary, // ✅
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
  borderRadius: 12,
  padding: 14,
};

const saveBtn = {
  padding: 16,
  borderRadius: 14,
  alignItems: "center" as const,
  marginTop: 32,
};
