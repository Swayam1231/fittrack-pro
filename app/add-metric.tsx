import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { FirestoreService } from "../src/services/firestore.service";
import { Card } from "../src/components/Card";
import Animated, { FadeInUp } from "react-native-reanimated";

const METRIC_TYPES = [
  { id: 'hr', label: 'Heart Rate', icon: 'heart', unit: 'bpm', color: '#ff6e84' },
  { id: 'vo2', label: 'VO2 Max', icon: 'airplane', unit: 'ml/kg/min', color: '#9bffce' },
  { id: 'sleep', label: 'Sleep Score', icon: 'moon', unit: '/100', color: '#a3a6ff' },
];

export default function AddMetric() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [selectedType, setSelectedType] = useState(METRIC_TYPES[0]);
  const [value, setValue] = useState("");

  const handleSave = async () => {
    if (!user || !value) return;
    const num = parseFloat(value);
    if (isNaN(num)) return;

    await FirestoreService.logMetric(user.uid, selectedType.id, num);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Log Biometrics</Text>
            <Text style={styles.subTitle}>Sync your latest physiological data</Text>
        </Animated.View>

        <View style={styles.grid}>
          {METRIC_TYPES.map((type) => (
            <Pressable 
              key={type.id} 
              onPress={() => setSelectedType(type)}
              style={styles.typeBtn}
            >
              <Card style={[
                styles.typeCard, 
                selectedType.id === type.id && { borderColor: type.color, backgroundColor: `${type.color}10` }
              ]}>
                <Ionicons 
                  name={type.icon as any} 
                  size={24} 
                  color={selectedType.id === type.id ? type.color : 'rgba(255,255,255,0.3)'} 
                />
                <Text style={[
                  styles.typeLabel, 
                  { color: selectedType.id === type.id ? colors.textPrimary : 'rgba(255,255,255,0.4)' }
                ]}>
                  {type.label}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <Card style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>ENTER {selectedType.label.toUpperCase()}</Text>
            <Text style={[styles.unitText, { color: selectedType.color }]}>{selectedType.unit}</Text>
          </View>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderBottomColor: selectedType.color }]}
            keyboardType="numeric"
            value={value}
            onChangeText={setValue}
            placeholder="0.0"
            placeholderTextColor="rgba(255,255,255,0.1)"
            autoFocus
          />
        </Card>

        <Pressable 
          onPress={handleSave} 
          style={({ pressed }) => [
            styles.saveBtn, 
            { backgroundColor: selectedType.color, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <Text style={styles.saveText}>SYNC TELEMETRY</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subTitle: { fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 32, marginTop: 4 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  typeBtn: { flex: 1 },
  typeCard: { padding: 16, alignItems: 'center', gap: 8, borderRadius: 20 },
  typeLabel: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  inputCard: { padding: 32, borderRadius: 32, alignItems: 'center' },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2 },
  unitText: { fontSize: 12, fontWeight: '800' },
  input: { fontSize: 64, fontWeight: '900', textAlign: 'center', width: '100%', borderBottomWidth: 2, paddingBottom: 8 },
  saveBtn: { height: 64, borderRadius: 20, marginTop: 40, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  cancelBtn: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '700' },
});
