import {
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../src/firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { Card } from "../src/components/Card";
import { useTheme } from "../src/context/ThemeContext"; // ✅ ADDED

type Preset = {
  id: string;
  name: string;
};

export default function ExercisePresets() {
  const uid = auth.currentUser?.uid;
  const { colors } = useTheme(); // ✅ ADDED

  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState("");

  const loadPresets = useCallback(async () => {
    if (!uid) return;

    const snap = await getDocs(
      query(
        collection(db, "users", uid, "exercisePresets"),
        orderBy("createdAt", "asc")
      )
    );

    setPresets(
      snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
      }))
    );
  }, [uid]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const addPreset = async () => {
    if (!uid || name.trim() === "") return;

    await addDoc(
      collection(db, "users", uid, "exercisePresets"),
      {
        name: name.trim(),
        createdAt: serverTimestamp(),
      }
    );

    setName("");
    loadPresets();
  };

  const deletePreset = (id: string) => {
    if (!uid) return;

    Alert.alert("Delete Exercise", "Remove this preset?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(
            doc(db, "users", uid, "exercisePresets", id)
          );
          loadPresets();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{
        padding: 16,
        backgroundColor: colors.background, // ✅
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
          color: colors.textPrimary, // ✅
        }}
      >
        Exercise Presets
      </Text>

      <Card>
        <Text style={{ color: colors.textPrimary }}>
          Add New Exercise
        </Text>
        <TextInput
          placeholder="e.g. Squat"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          style={{ color: colors.textPrimary }} // ✅
        />

        <Pressable
          onPress={addPreset}
          style={{
            backgroundColor: colors.accent, // ✅
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Add Preset
          </Text>
        </Pressable>
      </Card>

      <Card>
        {presets.length === 0 && (
          <Text style={{ color: colors.textSecondary }}>
            No presets yet.
          </Text>
        )}

        {presets.map((p) => (
          <Pressable
            key={p.id}
            onLongPress={() => deletePreset(p.id)}
            style={{
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderColor: colors.border, // ✅
            }}
          >
            <Text style={{ color: colors.textPrimary }}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}
