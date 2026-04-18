import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { FirestoreService, UserProfile } from "../src/services/firestore.service";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";

/* ---- COMPONENTS ---- */
import EditProfileModal from "../src/components/EditProfileModal";
import EditTrainingPreferencesModal from "../src/components/profile/EditTrainingPreferencesModal";
import GoalsMilestones from "../src/components/profile/GoalsMilestones";
import ProgressOverview from "../src/components/profile/ProgressOverview";
import SettingsSection from "../src/components/profile/SettingsSection";
import StatCard from "../src/components/profile/StatCard";
import TrainingPreferences from "../src/components/profile/TrainingPreferences";

/* ---- UTILS ---- */
import { formatHeight, formatWeight } from "../src/utils/unit";

export default function Profile() {
  const { user } = useAuth();
  const { colors, gradients } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editTrainingOpen, setEditTrainingOpen] = useState(false);

  /* ---------- REAL-TIME PROFILE ---------- */
  useEffect(() => {
    if (!user) return;

    return FirestoreService.subscribeToProfile(user.uid, (data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  /* ---------- GUARDS ---------- */
  if (!user) return null;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, padding: 32, justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 2, borderColor: colors.border, borderStyle: "dashed" }}>
            <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginBottom: 12 }}>Setup Profile</Text>
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
            Complete your profile to get personalized targets and track your transformations!
          </Text>
          <Pressable
            onPress={() => setEditOpen(true)}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Create Profile</Text>
          </Pressable>
        </View>
        <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} />
      </SafeAreaView>
    );
  }

  const unit = "metric";
  const heightDisplay = formatHeight(profile.height as any, unit);
  const weightDisplay = formatWeight(profile.weight as any, unit);
  const leanMass = (profile.weight || 0) * (1 - ((profile as any).bodyFat ?? 0) / 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* --- HEADER --- */}
        <Animated.View entering={FadeInUp.duration(600)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
           <Text style={{ fontSize: 32, fontWeight: "800", color: colors.textPrimary, letterSpacing: -1 }}>Account</Text>
           <Pressable onPress={() => setEditOpen(true)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
           </Pressable>
        </Animated.View>

        {/* --- PROFILE HERO --- */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
           <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <LinearGradient 
                colors={gradients.primary}
                style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginRight: 20 }}
              >
                  <Text style={{ fontSize: 32, color: "#fff", fontWeight: "800" }}>
                    {profile.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                  </Text>
              </LinearGradient>
              <View>
                 <Text style={{ fontSize: 24, fontWeight: "800", color: colors.textPrimary }}>{profile.displayName || "Anonymous"}</Text>
                 <Text style={{ fontSize: 14, color: colors.textSecondary }}>Member since 2026</Text>
              </View>
           </View>

           <View style={{ flexDirection: "row", gap: 12 }}>
              <ProfileStat label="Weight" value={weightDisplay} color={colors.accent} />
              <ProfileStat label="Height" value={heightDisplay} color={colors.primary} />
              <ProfileStat label="Lean Mass" value={formatWeight(leanMass, unit)} color={colors.success} />
           </View>
        </Animated.View>

        {/* --- ADDITIONAL SECTIONS --- */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <ProgressOverview />
            <TrainingPreferences onEdit={() => setEditTrainingOpen(true)} />
            <GoalsMilestones
              currentWeight={profile.weight}
              targetWeight={profile.goalWeight ?? null}
              goalStartWeight={profile.goalStartWeight ?? null}
              unit={unit}
            />
            <SettingsSection />
        </Animated.View>
      </ScrollView>

      <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} />
      <EditTrainingPreferencesModal visible={editTrainingOpen} onClose={() => setEditTrainingOpen(false)} />
    </SafeAreaView>
  );
}

function ProfileStat({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border }}>
       <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: "600" }}>{label}</Text>
       <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}
