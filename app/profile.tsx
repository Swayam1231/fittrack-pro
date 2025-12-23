import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../src/firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";

/* ---- COMPONENTS ---- */
import EditProfileModal from "../src/components/EditProfileModal";
import StatCard from "../src/components/profile/StatCard";
import ProgressOverview from "../src/components/profile/ProgressOverview";
import TrainingPreferences from "../src/components/profile/TrainingPreferences";
import GoalsMilestones from "../src/components/profile/GoalsMilestones";
import SettingsSection from "../src/components/profile/SettingsSection";
import UnitToggleModal from "../src/components/profile/UnitToggleModal";
import EditTrainingPreferencesModal from "../src/components/profile/EditTrainingPreferencesModal";

/* ---- UTILS ---- */
import {
  formatHeight,
  formatWeight,
  UnitSystem,
} from "../src/utils/unit";

export default function Profile() {
  const user = auth.currentUser;
  const [profile, setProfile] = useState<any>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editTrainingOpen, setEditTrainingOpen] = useState(false);

  if (!user) return null;

  /* ---------- REAL-TIME PROFILE (FIX) ---------- */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
    });
    return unsub;
  }, [user.uid]);

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading profile…</Text>
      </SafeAreaView>
    );
  }

  /* ---------- UNIT SYSTEM ---------- */
  const unit: UnitSystem = profile.preferences?.units ?? "imperial";


/* ---------- DERIVED VALUES ---------- */
const heightDisplay = formatHeight(profile.height, unit);
const weightDisplay = formatWeight(profile.weight, unit);

const leanMass =
  profile.weight * (1 - (profile.bodyFat ?? 0) / 100);

const leanMassRounded = Number(leanMass.toFixed(2));

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ================= CORE PROFILE ================= */}
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>Core Profile</Text>
            <Pressable onPress={() => setEditOpen(true)}>
              <Ionicons name="pencil" size={18} color="#2563EB" />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#7C3AED", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                {profile.name?.[0] ?? "U"}
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>{profile.name}</Text>
              <Text style={{ color: "#6B7280" }}>
                {profile.age} years • {profile.gender}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 16 }}>
            <View style={{ width: "48%", marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Height</Text>
              <Text style={{ fontWeight: "600" }}>{heightDisplay}</Text>
            </View>

            <View style={{ width: "48%", marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Current Weight</Text>
              <Text style={{ fontWeight: "600" }}>{weightDisplay}</Text>
            </View>

            <View style={{ width: "48%" }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Fitness Level</Text>
              <Text style={{ fontWeight: "600" }}>Intermediate</Text>
            </View>

            <View style={{ width: "48%" }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Primary Goal</Text>
              <Text style={{ fontWeight: "600", color: "#2563EB" }}>Fat Loss</Text>
            </View>
          </View>
        </View>

        {/* ================= FITNESS SNAPSHOT ================= */}
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
            Fitness Snapshot
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            <StatCard
              icon="body-outline"
              label="Body Fat"
              value={`${profile.bodyFat ?? "—"}%`}
              subtitle="Estimated"
              bg="#FDF2F8"
              color="#DB2777"
            />

            <StatCard
  icon="barbell-outline"
  label="Lean Mass"
  value={formatWeight(leanMassRounded, unit)}
  bg="#ECFDF5"
  color="#059669"
/>


            <StatCard
              icon="nutrition-outline"
              label="Daily Calories"
              value={`${profile.targets?.calories ?? "—"}`}
              subtitle="target"
              bg="#FEF2F2"
              color="#DC2626"
            />

            <StatCard
              icon="fitness-outline"
              label="Protein"
              value={`${profile.targets?.protein ?? "—"} g`}
              subtitle="daily"
              bg="#EEF2FF"
              color="#4F46E5"
            />
          </View>
        </View>

        <ProgressOverview />
        <TrainingPreferences onEdit={() => setEditTrainingOpen(true)} />

        {/* ================= GOALS & MILESTONES ================= */}
        <GoalsMilestones
  currentWeight={profile.weight}
  targetWeight={
    profile.goalWeight ??
    profile.targets?.goalWeight ??
    null
  }
  unit={unit}
/>


        <SettingsSection
          unit={unit}
          onUnitsPress={() => setUnitModalOpen(true)}
        />
      </ScrollView>

      <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} />
      <UnitToggleModal visible={unitModalOpen} current={unit} onClose={() => setUnitModalOpen(false)} />
      <EditTrainingPreferencesModal visible={editTrainingOpen} onClose={() => setEditTrainingOpen(false)} />
    </SafeAreaView>
  );
}
