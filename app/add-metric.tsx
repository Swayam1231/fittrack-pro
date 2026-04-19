import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Dimensions } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { FirestoreService } from "../src/services/firestore.service";
import { Card } from "../src/components/Card";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const METRIC_TYPES = [
  { id: 'hr', label: 'Heart Rate', icon: 'heart', unit: 'bpm', color: '#ff6e84' },
  { id: 'vo2', label: 'VO2 Max', icon: 'timer', unit: 'ml/kg', color: '#00d084' },
  { id: 'sleep', label: 'Sleep Score', icon: 'moon', unit: '/100', color: '#8127cf' },
];

export default function AddMetric() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, gradients } = useTheme();

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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Biometrics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(600)} style={styles.intro}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Log Metrics</Text>
            <Text style={[styles.subTitle, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>Record your physiological telemetry.</Text>
        </Animated.View>

        <View style={styles.grid}>
          {METRIC_TYPES.map((type) => (
            <Pressable 
              key={type.id} 
              onPress={() => setSelectedType(type)}
              style={styles.typeBtn}
            >
              <Card 
                variant={selectedType.id === type.id ? "solid" : "tonal"}
                style={[
                  styles.typeCard, 
                  selectedType.id === type.id && { borderColor: type.color, borderWidth: 1 }
                ]}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={24} 
                  color={selectedType.id === type.id ? type.color : colors.textSecondary} 
                />
                <Text style={[
                  styles.typeLabel, 
                  { 
                    color: selectedType.id === type.id ? colors.textPrimary : colors.textSecondary,
                    fontFamily: 'Manrope-Bold'
                  }
                ]}>
                  {type.label}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>ENTER {selectedType.label.toUpperCase()}</Text>
              <Text style={[styles.unitText, { color: selectedType.color, fontFamily: 'SpaceGrotesk-Bold' }]}>{selectedType.unit}</Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
              placeholder="0.0"
              placeholderTextColor={colors.onSurfaceVariant}
              autoFocus
            />
          </Card>
        </Animated.View>

        <View style={styles.actions}>
          <Pressable onPress={handleSave} style={styles.saveBtn}>
            <LinearGradient 
              colors={gradients.primary} 
              style={styles.gradient} 
              start={{x:0, y:0}} 
              end={{x:1, y:1}}
            >
              <Text style={[styles.saveText, { fontFamily: 'Manrope-Bold' }]}>SYNC DATA</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.textSecondary, fontFamily: 'Manrope-SemiBold' }]}>CANCEL</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12 
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16 },
  scroll: { padding: 24, paddingBottom: 60 },
  intro: { marginBottom: 32 },
  title: { fontSize: 36, letterSpacing: -1.5 },
  subTitle: { fontSize: 16, marginTop: 4 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  typeBtn: { flex: 1 },
  typeCard: { padding: 16, alignItems: 'center', gap: 8, borderRadius: 24 },
  typeLabel: { fontSize: 10, letterSpacing: 0.5, textAlign: 'center' },
  inputCard: { padding: 40, borderRadius: 40, alignItems: 'center' },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  inputLabel: { fontSize: 10, letterSpacing: 2 },
  unitText: { fontSize: 14 },
  input: { fontSize: 72, textAlign: 'center', width: '100%', marginTop: 8 },
  actions: { marginTop: 48 },
  saveBtn: { height: 64, borderRadius: 32, overflow: 'hidden' },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 18, letterSpacing: 1 },
  cancelBtn: { marginTop: 20, alignItems: 'center', padding: 12 },
  cancelText: { fontSize: 14, letterSpacing: 0.5 },
});
