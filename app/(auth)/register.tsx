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

export default function Register() {
  const router = useRouter();

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
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
        Create Account
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
        placeholder="Minimum 6 characters"
        value={password}
        onChangeText={setPassword}
      />

      {error && (
        <Text style={{ color: "#DC2626", marginTop: 8 }}>
          {error}
        </Text>
      )}

      {success && (
        <Text style={{ color: "#16A34A", marginTop: 8 }}>
          Account created successfully. Redirecting to login…
        </Text>
      )}

      <Pressable
        onPress={register}
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
          {loading ? "Creating account..." : "Register"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(auth)/login")}
        style={{ marginTop: 12, alignItems: "center" }}
      >
        <Text style={{ color: "#2563EB" }}>
          Already have an account? Login
        </Text>
      </Pressable>
    </View>
  );
}
