import {
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/firebase/firebase";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext"; // ✅ ADDED

export default function Register() {
  const router = useRouter();
  const { colors } = useTheme(); // ✅ ADDED

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid =
    email.trim().length > 0 &&
    password.length >= 6;

  const register = async () => {
    setError(null);

    if (!isValid) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      setSuccess(true);

      // Redirect to login after short delay
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1200);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered. Please login.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Registration failed. Try again.");
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
        Create Account
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
        placeholder="Minimum 6 characters"
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

      {success && (
        <Text
          style={{
            color: "#16A34A", // 🔒 LEFT AS-IS (success green)
            marginTop: 8,
          }}
        >
          Account created successfully. Redirecting to login…
        </Text>
      )}

      <Pressable
        onPress={register}
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
          {loading ? "Creating account..." : "Register"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(auth)/login")}
        style={{ marginTop: 12, alignItems: "center" }}
      >
        <Text style={{ color: colors.accent }}>
          Already have an account? Login
        </Text>
      </Pressable>
    </View>
  );
}
