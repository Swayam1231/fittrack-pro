import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { Timestamp } from "firebase/firestore";
import { FirestoreService } from "../src/services/firestore.service";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";

/* ================= COMPONENT ================= */

export default function AddCustomFood() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  const saveFood = async () => {
    if (!uid || !name || !calories) return;

    await FirestoreService.addCustomFood(uid, {
      name: name.trim(),
      caloriesPer100g: Number(calories),
      proteinPer100g: Number(protein) || 0,
      carbsPer100g: Number(carbs) || 0,
      fatsPer100g: Number(fats) || 0,
      source: "custom",
      createdAt: Timestamp.now(),
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: 8, letterSpacing: -1 }}>Custom Food</Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 32 }}>Add nutritional info per 100g</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ gap: 16 }}>
            <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>Food Name</Text>
                <TextInput
                    style={{ backgroundColor: colors.card, borderRadius: 12, height: 50, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                    placeholder="e.g. Grandma's Secret Stew"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>Calories</Text>
                    <TextInput
                        style={{ backgroundColor: colors.card, borderRadius: 12, height: 50, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                        keyboardType="numeric"
                        placeholder="kcal"
                        placeholderTextColor={colors.textSecondary}
                        value={calories}
                        onChangeText={setCalories}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>Protein</Text>
                    <TextInput
                        style={{ backgroundColor: colors.card, borderRadius: 12, height: 50, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                        keyboardType="numeric"
                        placeholder="g"
                        placeholderTextColor={colors.textSecondary}
                        value={protein}
                        onChangeText={setProtein}
                    />
                </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>Carbs</Text>
                    <TextInput
                        style={{ backgroundColor: colors.card, borderRadius: 12, height: 50, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                        keyboardType="numeric"
                        placeholder="g"
                        placeholderTextColor={colors.textSecondary}
                        value={carbs}
                        onChangeText={setCarbs}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>Fats</Text>
                    <TextInput
                        style={{ backgroundColor: colors.card, borderRadius: 12, height: 50, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                        keyboardType="numeric"
                        placeholder="g"
                        placeholderTextColor={colors.textSecondary}
                        value={fats}
                        onChangeText={setFats}
                    />
                </View>
            </View>

            <Pressable
                onPress={saveFood}
                style={{ backgroundColor: colors.primary, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 24, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
            >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Save Food</Text>
            </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
