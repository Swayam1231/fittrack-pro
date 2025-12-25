import {
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/firebase/firebase";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext"; // ✅ ADDED

export default function Login() {
  const router = useRouter();
  const { colors } = useTheme(); // ✅ ADDED

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid =
    email.trim().length > 0 &&
    password.length >= 6;

  const login = async () => {
    setError(null);

    if (!isValid) {
      setError("Enter a valid email and password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // ✅ EXPLICIT REDIRECT (THIS IS THE FIX)
      router.replace("/(tabs)");

    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Login failed. Check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        justifyContent: "center",
        backgroundColor: colors.background, // ✅ COLOR ONLY
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 16,
          color: colors.textPrimary, // ✅ COLOR ONLY
        }}
      >
        Login
      </Text>

      <Text style={{ color: colors.textSecondary }}>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        style={{ color: colors.textPrimary }} // ✅ COLOR ONLY
      />

      <Text style={{ marginTop: 12, color: colors.textSecondary }}>
        Password
      </Text>
      <TextInput
        secureTextEntry
        placeholder="Your password"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        style={{ color: colors.textPrimary }} // ✅ COLOR ONLY
      />

      {error && (
        <Text
          style={{
            color: colors.danger, // ✅ COLOR ONLY
            marginTop: 8,
          }}
        >
          {error}
        </Text>
      )}

      <Pressable
        onPress={login}
        disabled={!isValid || loading}
        style={{
          backgroundColor: isValid
            ? colors.accent // ✅ COLOR ONLY
            : colors.border, // ✅ COLOR ONLY
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(auth)/register")}
        style={{ marginTop: 12, alignItems: "center" }}
      >
        <Text style={{ color: colors.accent }}>
          Don’t have an account? Register
        </Text>
      </Pressable>
    </View>
  );
}
