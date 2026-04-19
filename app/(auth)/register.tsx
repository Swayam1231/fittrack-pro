import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../src/firebase/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function Register() {
  const router = useRouter();
  const { colors, gradients } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6;

  const register = async () => {
    setError(null);
    if (!isValid) return;

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;
      await updateProfile(user, { displayName: name.trim() });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        createdAt: Timestamp.now(),
        targets: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fats: 60
        },
        weight: 70,
        height: 170,
        age: 25,
        gender: "male",
        goalStartWeight: 70
      });

    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topShape} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
             <Ionicons name="pulse" size={48} color={colors.primary} />
             <Text style={[styles.title, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>
               Precision meets{"\n"}
               <Text style={{ color: colors.primary }}>Kinetic Energy</Text>
             </Text>
             <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>
               Join the clinical fitness revolution. Sync your metrics today.
             </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
             <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>FULL NAME</Text>
                <TextInput 
                  placeholder="Athlete Name"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={name}
                  onChangeText={setName}
                  style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.textPrimary, fontFamily: 'Manrope-Medium' }]}
                />
             </View>

             <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>EMAIL ADDRESS</Text>
                <TextInput 
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@precise.fit"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.textPrimary, fontFamily: 'Manrope-Medium' }]}
                />
             </View>

             <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Manrope-Bold' }]}>PASSWORD</Text>
                <TextInput 
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.textPrimary, fontFamily: 'Manrope-Medium' }]}
                />
             </View>

             {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

             <Pressable 
                onPress={register} 
                disabled={!isValid || loading}
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9, scale: 0.98 }]}
             >
                <LinearGradient colors={gradients.primary} style={styles.btnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                   <Text style={[styles.btnText, { fontFamily: 'Manrope-Bold' }]}>
                      {loading ? "INITIALIZING..." : "CREATE ACCOUNT"}
                   </Text>
                   <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
             </Pressable>

             <Pressable onPress={() => router.replace("/(auth)/login")} style={styles.loginLink}>
                <Text style={[styles.loginText, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>
                   Already calibrated? <Text style={{ color: colors.primary, fontFamily: 'Manrope-Bold' }}>Login</Text>
                </Text>
             </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import { ScrollView } from "react-native-gesture-handler";

const styles = StyleSheet.create({
  container: { flex: 1 },
  topShape: { 
    position: 'absolute', 
    top: -100, 
    right: -100, 
    width: 300, 
    height: 300, 
    borderRadius: 150, 
    backgroundColor: 'rgba(70, 72, 212, 0.05)' 
  },
  scroll: { paddingBottom: 60, paddingTop: 80 },
  header: { paddingHorizontal: 32, marginBottom: 48 },
  title: { fontSize: 36, lineHeight: 42, letterSpacing: -1, marginTop: 24 },
  subtitle: { fontSize: 15, marginTop: 12, lineHeight: 22 },
  form: { paddingHorizontal: 32 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  input: { 
    height: 56, 
    borderRadius: 16, 
    paddingHorizontal: 20, 
    fontSize: 15 
  },
  btn: { height: 64, borderRadius: 32, overflow: 'hidden', marginTop: 16 },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  btnText: { color: '#fff', fontSize: 16, letterSpacing: 0.5 },
  error: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  loginLink: { marginTop: 24, paddingVertical: 12, alignItems: 'center' },
  loginText: { fontSize: 15 },
});
