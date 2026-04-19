import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View, StyleSheet, Dimensions, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { FirestoreService, UserProfile } from "../src/services/firestore.service";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";

/* ---- COMPONENTS ---- */
import EditProfileModal from "../src/components/EditProfileModal";
import GoalsMilestones from "../src/components/profile/GoalsMilestones";
import SettingsSection from "../src/components/profile/SettingsSection";
import ProgressOverview from "../src/components/profile/ProgressOverview";

const { width } = Dimensions.get("window");

export default function Profile() {
  const { user } = useAuth();
  const { colors, gradients, theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    return FirestoreService.subscribeToProfile(user.uid, (data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  if (!user || loading || !profile) return null;

  const leanMass = (profile.weight || 0) * (1 - ((profile as any).bodyFat ?? 0) / 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* --- TOP APP BAR --- */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.brand, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Athlete Dossier</Text>
        <Pressable onPress={() => setEditOpen(true)} style={styles.editBtn}>
           <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
         {/* --- HERO SECTION --- */}
         <View style={styles.hero}>
            <View style={styles.avatarContainer}>
               <View style={[styles.avatarGlow, { backgroundColor: `${colors.primary}15` }]} />
               <View style={[styles.avatarPlate, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Image 
                    source={user.photoURL ? { uri: user.photoURL } : require("../assets/images/default-avatar.png")} 
                    style={styles.avatarImg} 
                  />
               </View>
            </View>
            <Text style={[styles.profileName, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{profile.displayName}</Text>
            <View style={[styles.tierBadge, { backgroundColor: colors.surfaceContainerLow }]}>
               <Text style={[styles.tierText, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>LEVEL 4 OPERATIVE</Text>
            </View>
         </View>

         {/* --- KEY METRICS --- */}
          <View style={styles.grid}>
             <MetricCard label="Weight" val={profile.weight ?? '--'} unit="kg" />
             <MetricCard label="Height" val={profile.height ?? '--'} unit="cm" />
             <MetricCard label="Lean Mass" val={leanMass > 0 ? leanMass.toFixed(1) : '--'} unit="kg" highlight />
          </View>
 
          {/* --- PROGRESS RETROSPECTIVE --- */}
          <View style={styles.contentBlock}>
             <ProgressOverview />
          </View>
 
          {/* --- GOALS BLOCK --- */}
          <View style={styles.contentBlock}>
             <Text style={[styles.blockTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Biometric Calibration</Text>
             <View style={[styles.blockCard, { backgroundColor: colors.surfaceContainerLow }]}>
                <GoalsMilestones
                    currentWeight={profile.weight ?? 0}
                    targetWeight={profile.goalWeight ?? null}
                    goalStartWeight={profile.goalStartWeight ?? null}
                    unit="kg"
                />
             </View>
          </View>

         {/* --- SYSTEM PREFERENCES --- */}
         <View style={styles.contentBlock}>
            <Text style={[styles.blockTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>System Tuning</Text>
            <View style={[styles.blockCard, { backgroundColor: colors.surfaceContainerLow }]}>
               <SettingsSection />
            </View>
         </View>
      </ScrollView>

      <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} />
    </SafeAreaView>
  );
}

function MetricCard({ label, val, unit, highlight }: any) {
  const { colors, gradients } = useTheme();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surfaceContainerLow }]}>
       <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>{label.toUpperCase()}</Text>
       <View style={styles.metricValRow}>
          <Text style={[styles.metricVal, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{val}</Text>
          <Text style={[styles.metricUnit, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Bold' }]}>{unit}</Text>
       </View>
       {highlight && <LinearGradient colors={gradients.primary} style={styles.metricLine} start={{x:0,y:0}} end={{x:1,y:0}} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  brand: { fontSize: 18, letterSpacing: -0.5 },
  menuBtn: { padding: 4 },
  editBtn: { padding: 4 },
  scroll: { paddingBottom: 100 },
  hero: { alignItems: 'center', paddingVertical: 40 },
  avatarContainer: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  avatarPlate: { width: 120, height: 120, borderRadius: 60, padding: 4, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 56 },
  profileName: { fontSize: 36, letterSpacing: -1, marginTop: 24 },
  tierBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 8 },
  tierText: { fontSize: 10, letterSpacing: 1.5 },
  grid: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 40 },
  metricCard: { flex: 1, padding: 20, borderRadius: 24, justifyContent: 'space-between', minHeight: 120, overflow: 'hidden' },
  metricLabel: { fontSize: 9, letterSpacing: 0.5 },
  metricValRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  metricVal: { fontSize: 24 },
  metricUnit: { fontSize: 12, marginLeft: 2 },
  metricLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  contentBlock: { paddingHorizontal: 24, marginBottom: 40 },
  blockTitle: { fontSize: 20, marginBottom: 16 },
  blockCard: { borderRadius: 32, padding: 24 },
});
