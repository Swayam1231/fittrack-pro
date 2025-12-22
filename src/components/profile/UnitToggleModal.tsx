import { View, Text, Pressable, Modal } from "react-native";
import { UnitSystem } from "../../utils/unit";
import { auth, db } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";

type Props = {
  visible: boolean;
  current: UnitSystem;
  onClose: () => void;
};

export default function UnitToggleModal({
  visible,
  current,
  onClose,
}: Props) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const setUnit = async (unit: UnitSystem) => {
    await updateDoc(doc(db, "users", uid), {
      "preferences.units": unit,
    });
    onClose();
  };

  const Option = ({ label, value }: { label: string; value: UnitSystem }) => (
    <Pressable
      onPress={() => setUnit(value)}
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: current === value ? "#EEF2FF" : "#F9FAFB",
        marginBottom: 12,
      }}
    >
      <Text style={{ fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            padding: 16,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
            Units
          </Text>

          <Option label="Metric (kg, cm)" value="metric" />
          <Option label="Imperial (lbs, ft)" value="imperial" />

          <Pressable onPress={onClose}>
            <Text
              style={{
                textAlign: "center",
                marginTop: 8,
                color: "#6B7280",
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
