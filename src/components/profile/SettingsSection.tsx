import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebase/firebase";

/* ---------- TYPES ---------- */
type UnitSystem = "metric" | "imperial";

type Props = {
  unit: UnitSystem;
  onUnitsPress: () => void;
};

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
          color: danger ? "#DC2626" : "#111827",
          fontWeight: "500",
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
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#9CA3AF"
        />
      )}
    </Pressable>
  );
}

/* ---------- MAIN COMPONENT ---------- */
export default function SettingsSection({ unit, onUnitsPress }: Props) {
  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => auth.signOut(),
        },
      ]
    );
  };

  return (
    <>
      {/* ---------- SETTINGS CARD ---------- */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
          Settings
        </Text>

        <Row
          icon="swap-horizontal-outline"
          label="Units"
          value={unit === "imperial" ? "Imperial" : "Metric"}
          onPress={onUnitsPress}
        />

        <Row
          icon="color-palette-outline"
          label="Theme"
          value="System"
        />

        <Row
          icon="notifications-outline"
          label="Notifications"
        />

        <Row
          icon="lock-closed-outline"
          label="Privacy Settings"
        />

        <Row
          icon="download-outline"
          label="Export Data"
        />

        <Row
          icon="log-out-outline"
          label="Logout"
          danger
          onPress={handleLogout}
        />
      </View>

      {/* ---------- INFO FOOTER ---------- */}
      <View
        style={{
          backgroundColor: "#EFF6FF",
          borderRadius: 12,
          padding: 12,
          marginBottom: 32,
        }}
      >
        <Text style={{ fontSize: 12, color: "#2563EB", fontWeight: "600" }}>
          About Your Data
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: "#374151",
            marginTop: 4,
            lineHeight: 16,
          }}
        >
          All calculations are personalized based on your profile.
          Metrics such as BMI, body fat %, and BMR are estimates.
          Your data is private and used only to improve your experience.
        </Text>
      </View>
    </>
  );
}
