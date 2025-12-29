import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../firebase/firebase";
import { useTheme } from "../../context/ThemeContext";

/* ---------- ROW COMPONENT ---------- */
type RowProps = {
  icon: any;
  label: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
};

function Row({ icon, label, value, danger, onPress }: RowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
      }}
    >
      <Ionicons
        name={icon}
        size={18}
        color={danger ? colors.danger : colors.textSecondary}
        style={{ width: 28 }}
      />

      <Text
        style={{
          flex: 1,
          fontWeight: "500",
          color: danger ? colors.danger : colors.textPrimary,
        }}
      >
        {label}
      </Text>

      {value && (
        <Text
          style={{
            color: colors.textSecondary,
            marginRight: 6,
          }}
        >
          {value}
        </Text>
      )}

      {!danger && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.border}
        />
      )}
    </Pressable>
  );
}

/* ---------- MAIN SETTINGS ---------- */
export default function SettingsSection() {
  const { mode, setMode, colors } = useTheme();
  const router = useRouter();

  /* ---- THEME CYCLER ---- */
  const nextTheme =
    mode === "system" ? "light" : mode === "light" ? "dark" : "system";

  const themeLabel =
    mode === "system" ? "System" : mode === "light" ? "Light" : "Dark";

  /* ---- EXPORT PLACEHOLDER ---- */
  const handleExport = () => {
    Alert.alert(
      "Export Data",
      "Export as CSV or PDF will be available soon."
    );
  };

  /* ---- LOGOUT (FIXED) ---- */
  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);

            // 🔥 HARD RESET NAVIGATION
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Failed to log out. Try again.");
          }
        },
      },
    ]);
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 8,
          color: colors.textPrimary,
        }}
      >
        Settings
      </Text>

      <Row
        icon="color-palette-outline"
        label="Theme"
        value={themeLabel}
        onPress={() => setMode(nextTheme)}
      />

      <Row
        icon="download-outline"
        label="Export Data"
        onPress={handleExport}
      />

      <Row
        icon="log-out-outline"
        label="Logout"
        danger
        onPress={handleLogout}
      />
    </View>
  );
}
