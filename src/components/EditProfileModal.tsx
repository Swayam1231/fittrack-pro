import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useTheme } from "../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";

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

const FITNESS_LEVEL_META: Record<FitnessLevel, { icon: any; hint: string }> = {
  Beginner: { icon: "leaf-outline", hint: "Just starting or returning" },
  Intermediate: { icon: "barbell-outline", hint: "Consistent 3-5 days/week" },
  Advanced: { icon: "flame-outline", hint: "High volume intensity" },
};

export default function EditProfileModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const uid = auth.currentUser?.uid;
  const { colors, gradients } = useTheme();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>("Intermediate");
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>("Fat Loss");

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

  const saveProfile = async () => {
    if (!name || !age || !height || !weight) {
      Alert.alert("Missing fields", "Please fill required fields.");
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

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
           <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Core Profile</Text>
           <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
           </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
             <Text style={[styles.label, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>FULL NAME</Text>
             <TextInput 
               value={name} 
               onChangeText={setName} 
               style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.textPrimary, fontFamily: 'Manrope-Medium' }]} 
             />
          </View>

          <View style={styles.section}>
             <Text style={[styles.label, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>BIOMETRICS</Text>
             <View style={styles.row}>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Age</Text>
                   <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={[styles.inputSmall, { backgroundColor: colors.surfaceContainerLow, color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                   <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Height (cm)</Text>
                   <TextInput value={height} onChangeText={setHeight} keyboardType="number-pad" style={[styles.inputSmall, { backgroundColor: colors.surfaceContainerLow, color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]} />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Weight (kg)</Text>
                   <TextInput value={weight} onChangeText={setWeight} keyboardType="number-pad" style={[styles.inputSmall, { backgroundColor: colors.surfaceContainerLow, color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]} />
                </View>
             </View>
          </View>

          <View style={styles.section}>
             <Text style={[styles.label, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>FITNESS LEVEL</Text>
             {(["Beginner", "Intermediate", "Advanced"] as FitnessLevel[]).map((level) => {
               const selected = fitnessLevel === level;
               const meta = FITNESS_LEVEL_META[level];
               return (
                 <Pressable
                   key={level}
                   onPress={() => setFitnessLevel(level)}
                   style={[styles.levelBtn, { backgroundColor: selected ? colors.primary : colors.surfaceContainerLow }]}
                 >
                   <Ionicons name={meta.icon} size={20} color={selected ? "#fff" : colors.primary} />
                   <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.levelName, { color: selected ? "#fff" : colors.textPrimary, fontFamily: 'Manrope-Bold' }]}>{level}</Text>
                      <Text style={[styles.levelHint, { color: selected ? "rgba(255,255,255,0.7)" : colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>{meta.hint}</Text>
                   </View>
                   {selected && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                 </Pressable>
               );
             })}
          </View>

          <View style={styles.section}>
             <Text style={[styles.label, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>PRIMARY GOAL</Text>
             <View style={styles.goalRow}>
                {(["Fat Loss", "Maintenance", "Muscle Gain"] as PrimaryGoal[]).map(g => (
                   <Pressable 
                     key={g} 
                     onPress={() => setPrimaryGoal(g)}
                     style={[styles.goalBtn, { backgroundColor: primaryGoal === g ? colors.secondary : colors.surfaceContainerLow }]}
                   >
                      <Text style={[styles.goalText, { color: primaryGoal === g ? "#fff" : colors.textPrimary, fontFamily: 'Manrope-Bold' }]}>{g.split(" ")[0]}</Text>
                   </Pressable>
                ))}
             </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
           <Pressable onPress={saveProfile} style={styles.saveBtn}>
              <LinearGradient colors={gradients.primary} style={styles.saveBtnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                 <Text style={[styles.saveBtnText, { fontFamily: 'Manrope-Bold' }]}>SAVE & RECALCULATE</Text>
              </LinearGradient>
           </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, letterSpacing: -1 },
  closeBtn: { padding: 4 },
  scroll: { paddingHorizontal: 24 },
  section: { marginBottom: 32 },
  label: { fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  subLabel: { fontSize: 12, marginBottom: 8, opacity: 0.6 },
  input: { height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16 },
  row: { flexDirection: 'row' },
  inputSmall: { height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 18, textAlign: 'center' },
  levelBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
  levelName: { fontSize: 15 },
  levelHint: { fontSize: 12, marginTop: 2 },
  goalRow: { flexDirection: 'row', gap: 8 },
  goalBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalText: { fontSize: 12 },
  footer: { padding: 24, borderTopWidth: 0 },
  saveBtn: { height: 64, borderRadius: 32, overflow: 'hidden' },
  saveBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, letterSpacing: 0.5 },
});
