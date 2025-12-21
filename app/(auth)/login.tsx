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

export default function Login() {
  const router = useRouter();

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
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
        Login
      </Text>

      <Text>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={{ marginTop: 12 }}>Password</Text>
      <TextInput
        secureTextEntry
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
      />

      {error && (
        <Text style={{ color: "#DC2626", marginTop: 8 }}>
          {error}
        </Text>
      )}

      <Pressable
        onPress={login}
        disabled={!isValid || loading}
        style={{
          backgroundColor: isValid ? "#2563EB" : "#9CA3AF",
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
        <Text style={{ color: "#2563EB" }}>
          Don’t have an account? Register
        </Text>
      </Pressable>
    </View>
  );
}
