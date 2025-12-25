import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
        color={danger ? "#DC2626" : "#374151"}
        style={{ width: 28 }}
      />

      <Text
        style={{
          flex: 1,
          fontWeight: "500",
          color: danger ? "#DC2626" : "#111827",
        }}
      >
        {label}
      </Text>

      {value && (
        <Text style={{ color: "#6B7280", marginRight: 6 }}>
          {value}
        </Text>
      )}

      {!danger && (
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      )}
    </Pressable>
  );
}

/* ---------- MAIN SETTINGS ---------- */
export default function SettingsSection() {
  const { mode, setMode } = useTheme();

  /* ---- THEME CYCLER ---- */
  const nextTheme =
    mode === "system" ? "light" : mode === "light" ? "dark" : "system";

  const themeLabel =
    mode === "system" ? "System" : mode === "light" ? "Light" : "Dark";

  /* ---- EXPORT PLACEHOLDERS ---- */
  const handleExport = () => {
    Alert.alert(
      "Export Data",
      "Export as CSV or PDF will be available soon."
    );
  };

  /* ---- LOGOUT ---- */
  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => auth.signOut(),
      },
    ]);
  };

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
        Settings
      </Text>

      {/* THEME (WORKING) */}
      <Row
        icon="color-palette-outline"
        label="Theme"
        value={themeLabel}
        onPress={() => setMode(nextTheme)}
      />

      {/* EXPORT (RESTORED) */}
      <Row
        icon="download-outline"
        label="Export Data"
        onPress={handleExport}
      />

      {/* LOGOUT (RESTORED) */}
      <Row
        icon="log-out-outline"
        label="Logout"
        danger
        onPress={handleLogout}
      />
    </View>
  );
}
