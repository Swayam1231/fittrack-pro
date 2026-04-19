import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../firebase/firebase";
import { useTheme } from "../../context/ThemeContext";

type RowProps = {
  icon: any;
  label: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
};

function Row({ icon, label, value, danger, onPress }: RowProps) {
  const { colors, theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surfaceContainerLowest },
        pressed && { transform: [{ scale: 0.98 }] }
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainerLow }]}>
           <Ionicons
             name={icon}
             size={18}
             color={danger ? colors.danger : colors.primary}
           />
        </View>
        <Text
          style={[
            styles.label,
            { color: danger ? colors.danger : colors.textPrimary, fontFamily: 'Manrope-Bold' }
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.rowRight}>
        {value && <Text style={[styles.value, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Bold' }]}>{value}</Text>}
        <Ionicons name="chevron-forward" size={14} color={colors.onSurfaceVariant} />
      </View>
    </Pressable>
  );
}

export default function SettingsSection() {
  const { mode, setMode } = useTheme();
  const router = useRouter();

  const nextTheme = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
  const themeLabel = mode === "system" ? "OS AUTO" : mode === "light" ? "LIGHT" : "DARK";

  const handleLogout = () => {
    Alert.alert("DISCONNECT", "Terminate current session?", [
      { text: "ABORT", style: "cancel" },
      {
        text: "DISCONNECT",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout failed:", error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Row
        icon="color-palette-outline"
        label="Environment Engine"
        value={themeLabel}
        onPress={() => setMode(nextTheme)}
      />

      <Row
        icon="cloud-download-outline"
        label="Dossier Export"
        onPress={() => Alert.alert("Export", "Compiling history...")}
      />

      <View style={styles.spacer} />

      <Row
        icon="log-out-outline"
        label="Disconnect Identity"
        danger
        onPress={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', padding: 16, borderRadius: 20 },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  label: { fontSize: 15 },
  rowRight: { flexDirection: "row", alignItems: "center" },
  value: { fontSize: 11, marginRight: 8, letterSpacing: 1 },
  spacer: { height: 12 },
});
