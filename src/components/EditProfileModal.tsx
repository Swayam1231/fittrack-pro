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
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useTheme } from "../context/ThemeContext";

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

/* ---- FITNESS LEVEL META ---- */
const FITNESS_LEVEL_META: Record<
  FitnessLevel,
  { icon: any; hint: string }
> = {
  Beginner: {
    icon: "leaf-outline",
    hint: "New to training or inconsistent workouts",
  },
  Intermediate: {
    icon: "barbell-outline",
    hint: "Training regularly (3–5 days/week)",
  },
  Advanced: {
    icon: "flame-outline",
    hint: "High volume, intense training experience",
  },
};

export default function EditProfileModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const uid = auth.currentUser?.uid;
  const { colors } = useTheme();

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

  if (!uid) return null;

  /* ---- SAVE ---- */
  const saveProfile = async () => {
    if (!name || !age || !height || !weight) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }

    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);
    const bfNum = bodyFat ? Number(bodyFat) : undefined;

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
      targets,
    });

    onClose();
  };

  /* ---- UI ---- */
  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 20,
              color: colors.textPrimary,
            }}
          >
            Edit Core Profile
          </Text>

          <Label text="Name *" />
          <Input value={name} onChangeText={setName} />

          <Segment
            title="Gender *"
            options={["Male", "Female"]}
            value={gender}
            onChange={setGender}
          />

          <Label text="Age *" />
          <Input value={age} onChangeText={setAge} keyboardType="number-pad" />

          <Label text="Height (cm) *" />
          <Input value={height} onChangeText={setHeight} keyboardType="number-pad" />

          <Label text="Weight (kg) *" />
          <Input value={weight} onChangeText={setWeight} keyboardType="number-pad" />

          <Label text="Body Fat % (optional)" />
          <Input
            value={bodyFat}
            onChangeText={setBodyFat}
            keyboardType="decimal-pad"
            placeholder="e.g. 22"
          />

          {/* 🔥 FITNESS LEVEL WITH ICONS */}
          <Label text="Fitness Level *" />
          {(["Beginner", "Intermediate", "Advanced"] as FitnessLevel[]).map(
            (level) => {
              const selected = fitnessLevel === level;
              const meta = FITNESS_LEVEL_META[level];

              return (
                <Pressable
                  key={level}
                  onPress={() => setFitnessLevel(level)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 14,
                    marginBottom: 10,
                    backgroundColor: selected
                      ? colors.accent
                      : colors.card,
                  }}
                >
                  <Ionicons
                    name={meta.icon}
                    size={22}
                    color={selected ? "#fff" : colors.textPrimary}
                    style={{ marginRight: 12 }}
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: selected ? "#fff" : colors.textPrimary,
                      }}
                    >
                      {level}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        marginTop: 2,
                        color: selected
                          ? "#E5E7EB"
                          : colors.textSecondary,
                      }}
                    >
                      {meta.hint}
                    </Text>
                  </View>
                </Pressable>
              );
            }
          )}

          <Segment
            title="Primary Goal *"
            options={["Fat Loss", "Maintenance", "Muscle Gain"]}
            value={primaryGoal}
            onChange={setPrimaryGoal}
          />

          <Pressable
            onPress={saveProfile}
            style={{
              marginTop: 32,
              padding: 16,
              borderRadius: 14,
              backgroundColor: colors.accent,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Save & Recalculate
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={{ textAlign: "center", color: colors.textSecondary }}>
              Cancel
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ---- REUSABLES ---- */

function Label({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 6,
        color: colors.textPrimary,
      }}
    >
      {text}
    </Text>
  );
}

function Input(props: any) {
  const { colors } = useTheme();
  return (
    <TextInput
      {...props}
      style={{
        borderRadius: 12,
        padding: 14,
        backgroundColor: colors.card,
        color: colors.textPrimary,
      }}
      placeholderTextColor={colors.textSecondary}
    />
  );
}

/* ---- SEGMENT (unchanged) ---- */
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
  const { colors } = useTheme();

  return (
    <>
      <Label text={title} />
      <View style={{ flexDirection: "row", borderRadius: 12, overflow: "hidden" }}>
        {options.map((o) => (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              flex: 1,
              paddingVertical: 12,
              backgroundColor: value === o ? colors.accent : colors.border,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: value === o ? "#fff" : colors.textPrimary,
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
