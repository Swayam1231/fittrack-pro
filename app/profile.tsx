import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../src/firebase/firebase";

/* ---- COMPONENTS ---- */
import EditProfileModal from "../src/components/EditProfileModal";
import EditTrainingPreferencesModal from "../src/components/profile/EditTrainingPreferencesModal";
import GoalsMilestones from "../src/components/profile/GoalsMilestones";
import ProgressOverview from "../src/components/profile/ProgressOverview";
import SettingsSection from "../src/components/profile/SettingsSection";
import StatCard from "../src/components/profile/StatCard";
import TrainingPreferences from "../src/components/profile/TrainingPreferences";

/* ---- UTILS ---- */
import { useTheme } from "../src/context/ThemeContext"; // ✅ ADDED
import { formatHeight, formatWeight } from "../src/utils/unit";

export default function Profile() {
  const user = auth.currentUser;
  const { colors } = useTheme(); // ✅ ADDED
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editTrainingOpen, setEditTrainingOpen] = useState(false);

  /* ---------- REAL-TIME PROFILE ---------- */
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setLoading(false);
    });

    return unsub;
  }, [user, user?.uid]);

  /* ---------- GUARDS ---------- */
  if (!user) return null;

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.textPrimary }}>Loading profile…</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            padding: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="person-outline" size={64} color={colors.accent} />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              fontWeight: "700",
              marginTop: 20,
            }}
          >
            No Profile Found
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginVertical: 12,
            }}
          >
            We could not find your profile details. Let is set them up now!
          </Text>
          <Pressable
            onPress={() => setEditOpen(true)}
            style={{
              backgroundColor: colors.accent,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Create Profile
            </Text>
          </Pressable>
        </View>
        <EditProfileModal
          visible={editOpen}
          onClose={() => setEditOpen(false)}
        />
      </SafeAreaView>
    );
  }

  /* ---------- METRIC SYSTEM (DEFAULT & LOCKED) ---------- */
  const unit = "metric";

  /* ---------- DERIVED VALUES ---------- */
  const heightDisplay = formatHeight(profile.height, unit);
  const weightDisplay = formatWeight(profile.weight, unit);

  const leanMass = profile.weight * (1 - (profile.bodyFat ?? 0) / 100);

  const leanMassRounded = Number(leanMass.toFixed(2));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* ================= CORE PROFILE ================= */}
        <View
          style={{
            backgroundColor: colors.card, // ✅
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.textPrimary, // ✅
              }}
            >
              Core Profile
            </Text>
            <Pressable onPress={() => setEditOpen(true)}>
              <Ionicons
                name="pencil"
                size={18}
                color={colors.accent} // ✅
              />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.accent, // ✅ (was purple)
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                {profile.name?.[0] ?? "U"}
              </Text>
            </View>

            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.textPrimary, // ✅
                }}
              >
                {profile.name}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                {profile.age} years • {profile.gender}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <View style={{ width: "48%", marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary, // ✅
                }}
              >
                Height
              </Text>
              <Text
                style={{
                  fontWeight: "600",
                  color: colors.textPrimary, // ✅
                }}
              >
                {heightDisplay}
              </Text>
            </View>

            <View style={{ width: "48%", marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary, // ✅
                }}
              >
                Current Weight
              </Text>
              <Text
                style={{
                  fontWeight: "600",
                  color: colors.textPrimary, // ✅
                }}
              >
                {weightDisplay}
              </Text>
            </View>
          </View>
        </View>

        {/* ================= FITNESS SNAPSHOT ================= */}
        <View
          style={{
            backgroundColor: colors.card, // ✅
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 12,
              color: colors.textPrimary, // ✅
            }}
          >
            Fitness Snapshot
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <StatCard
              icon="body-outline"
              label="Body Fat"
              value={`${profile.bodyFat ?? "—"}%`}
              subtitle="Estimated"
              bg={colors.card} /* unchanged prop, themed upstream */
              color={colors.danger}
            />

            <StatCard
              icon="barbell-outline"
              label="Lean Mass"
              value={formatWeight(leanMassRounded, unit)}
              bg={colors.card}
              color={colors.accent}
            />
          </View>
        </View>

        <ProgressOverview />
        <TrainingPreferences onEdit={() => setEditTrainingOpen(true)} />

        <GoalsMilestones
          currentWeight={profile.weight}
          targetWeight={profile.goalWeight ?? null}
          goalStartWeight={profile.goalStartWeight ?? null}
          unit={unit}
        />

        <SettingsSection />
      </ScrollView>

      <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} />
      <EditTrainingPreferencesModal
        visible={editTrainingOpen}
        onClose={() => setEditTrainingOpen(false)}
      />
    </SafeAreaView>
  );
}
