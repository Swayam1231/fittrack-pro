import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

type TrainingType = "Gym" | "Home" | "Mixed";

type TrainingPrefs = {
  trainingType: TrainingType;
  frequency: number;
  split: string;
  equipment: string;
  cardio: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function EditTrainingPreferencesModal({
  visible,
  onClose,
}: Props) {
  const uid = auth.currentUser?.uid;

  const [prefs, setPrefs] = useState<TrainingPrefs>({
    trainingType: "Gym",
    frequency: 5,
    split: "Push / Pull / Legs",
    equipment: "Full gym access",
    cardio: "Moderate",
  });

  /* ---------- LOAD EXISTING PREFS ---------- */
  useEffect(() => {
    if (!visible || !uid) return;

    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return;

      const data = snap.data();
      if (data.preferences?.training) {
        setPrefs(data.preferences.training);
      }
    })();
  }, [visible, uid]);

  /* ---------- GUARD AFTER HOOKS ---------- */
  if (!uid) return null;

  const setField = (key: keyof TrainingPrefs, value: any) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const savePrefs = async () => {
    await updateDoc(doc(db, "users", uid), {
      "preferences.training": prefs,
    });
    onClose();
  };

  const Option = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: selected ? "#EEF2FF" : "#F9FAFB",
        marginBottom: 8,
      }}
    >
      <Text style={{ fontWeight: selected ? "600" : "400" }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
          Training Preferences
        </Text>

        <Text style={{ fontWeight: "600", marginBottom: 8 }}>
          Training Type
        </Text>
        {["Gym", "Home", "Mixed"].map((t) => (
          <Option
            key={t}
            label={t}
            selected={prefs.trainingType === t}
            onPress={() => setField("trainingType", t)}
          />
        ))}

        <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
          Workout Frequency
        </Text>
        {[3, 4, 5, 6].map((d) => (
          <Option
            key={d}
            label={`${d} days / week`}
            selected={prefs.frequency === d}
            onPress={() => setField("frequency", d)}
          />
        ))}

        <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
          Preferred Split
        </Text>
        {["Push / Pull / Legs", "Upper / Lower", "Full Body"].map((s) => (
          <Option
            key={s}
            label={s}
            selected={prefs.split === s}
            onPress={() => setField("split", s)}
          />
        ))}

        <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
          Equipment
        </Text>
        {["Full gym access", "Limited equipment", "Bodyweight only"].map((e) => (
          <Option
            key={e}
            label={e}
            selected={prefs.equipment === e}
            onPress={() => setField("equipment", e)}
          />
        ))}

        <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
          Cardio Preference
        </Text>
        {["Low", "Moderate", "High"].map((c) => (
          <Option
            key={c}
            label={c}
            selected={prefs.cardio === c}
            onPress={() => setField("cardio", c)}
          />
        ))}

        <Pressable
          onPress={savePrefs}
          style={{
            backgroundColor: "#2563EB",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Save Preferences
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
