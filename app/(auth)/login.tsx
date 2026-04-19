import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ImageBackground
} from "react-native";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/firebase/firebase";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../src/components/Card";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

export default function Login() {
  const router = useRouter();
  const { colors, gradients } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isValid = email.trim().length > 0 && password.length >= 6;

  const login = async () => {
    setError(null);
    if (!isValid) {
      setError("Enter a valid email and password.");
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError("Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Overlay Effect */}
      <View style={styles.bgGlow} />

      <View style={styles.main}>
        {/* Brand Header */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.brandHeader}>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            FitTrack <Text style={{ color: colors.primary }}>Pro</Text>
          </Text>
          <Text style={styles.brandTagline}>THE KINETIC OBSERVATORY</Text>
        </Animated.View>

        {/* Glassmorphic Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          <Card style={styles.card}>
            <View style={styles.cardGlow} />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="operator@kinetic.app"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <Pressable><Text style={[styles.forgot, { color: colors.primary }]}>Forgot?</Text></Pressable>
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  secureTextEntry={!showPass}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { color: colors.textPrimary }]}
                />
                <Pressable onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}

            <Pressable
              onPress={login}
              disabled={!isValid || loading}
              style={({ pressed }) => [
                styles.button,
                { opacity: isValid ? (pressed ? 0.9 : 1) : 0.5 }
              ]}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>Initialize</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </Card>
        </Animated.View>

        {/* Create Account Link */}
        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.footer}>
          <Text style={styles.footerText}>
            New telemetry target? 
            <Text 
              onPress={() => router.push("/(auth)/register")}
              style={[styles.link, { color: colors.primary }]}
            > Create Account</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    borderRadius: 200,
    filter: 'blur(80px)' as any,
  },
  main: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -2,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  brandTagline: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 8,
  },
  card: {
    padding: 24,
  },
  cardGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(163, 166, 255, 0.1)',
    borderRadius: 75,
    filter: 'blur(30px)' as any,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgot: {
    fontSize: 10,
    fontWeight: '800',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: '#ff6e84',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    fontWeight: '700',
  },
});
