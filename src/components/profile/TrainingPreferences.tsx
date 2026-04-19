import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

type Props = {
  onEdit: () => void;
};

export default function TrainingPreferences({ onEdit }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>PROTOCOL CONFIGURATION</Text>
        <Pressable onPress={onEdit}>
           <Ionicons name="options-outline" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
        {[
          { label: "Environment", value: "Strength Lab" },
          { label: "Frequency", value: "5 Units / Week" },
          { label: "Architecture", value: "PPL Segmented" },
          { label: "Load Intensity", value: "High Volume" },
        ].map((item, idx) => (
          <View key={item.label} style={[styles.row, idx !== 0 && { marginTop: 12 }]}>
            <Text style={[styles.label, { color: colors.onSurfaceVariant, fontFamily: 'Manrope-Bold' }]}>{item.label.toUpperCase()}</Text>
            <Text style={[styles.value, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 10, letterSpacing: 1.5 },
  card: { padding: 24, borderRadius: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 9, letterSpacing: 0.5 },
  value: { fontSize: 13 },
});
