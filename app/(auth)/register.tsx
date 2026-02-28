import {
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../src/firebase/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";

export default function Register() {
  const router = useRouter();
  const { colors } = useTheme();

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

    if (!isValid) {
      setError("Please fill all fields. Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // Update Auth Profile (Internal to Firebase Auth, usually always works)
      await updateProfile(user, { displayName: name.trim() });

      // Try to create Firestore document, but don't block the user if it fails
      // (e.g. due to temporary permission or network issues)
      try {
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
      } catch (dbErr) {
        console.warn("Firestore initialization failed, but user is authenticated:", dbErr);
        // We continue anyway, the Profile screen will catch the missing document
      }

      // The global onAuthStateChanged in _layout.tsx will now trigger and redirect to /(tabs)
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered. Please login.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        // Show specific error for debugging
        setError(err.message || "Registration failed. Try again.");
        console.error("Registration Error:", err);
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
        backgroundColor: colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 16,
          color: colors.textPrimary,
        }}
      >
        Create Account
      </Text>

      <Text style={{ color: colors.textSecondary }}>Name</Text>
      <TextInput
        placeholder="Your Name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
        style={{
          color: colors.textPrimary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingVertical: 8,
          marginBottom: 16
        }}
      />

      <Text style={{ color: colors.textSecondary }}>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        style={{
          color: colors.textPrimary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingVertical: 8,
          marginBottom: 16
        }}
      />

      <Text style={{ color: colors.textSecondary }}>
        Password
      </Text>
      <TextInput
        secureTextEntry
        placeholder="Minimum 6 characters"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        style={{
          color: colors.textPrimary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingVertical: 8,
          marginBottom: 16
        }}
      />

      {error && (
        <Text
          style={{
            color: colors.danger,
            marginTop: 8,
          }}
        >
          {error}
        </Text>
      )}

      <Pressable
        onPress={register}
        disabled={!isValid || loading}
        style={{
          backgroundColor: isValid
            ? colors.accent
            : colors.border,
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
