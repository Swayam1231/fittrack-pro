import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";
import Animated, { FadeInUp, FadeInDown, ZoomIn } from "react-native-reanimated";

export default function ShareWorkout() {
  const params = useLocalSearchParams<any>();
  const { colors, gradients } = useTheme();
  const router = useRouter();

  const workoutName = params.name || "Workout";
  const duration = params.duration || "0";
  const calories = params.calories || "0";
  const date = params.date || new Date().toLocaleDateString();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Pressable onPress={() => router.back()}>
             <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Share your progress</Text>
          <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, alignItems: "center" }}>
          <Animated.View 
            entering={ZoomIn.duration(600)}
            style={styles.cardWrapper}
          >
            <LinearGradient
               colors={gradients.primary}
               style={styles.shareCard}
            >
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 40 }}>
                        <View>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>FITTRACK PRO</Text>
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "500" }}>{date}</Text>
                        </View>
                        <Ionicons name="fitness" size={32} color="#fff" />
                    </View>

                    <Text style={{ color: "#fff", fontSize: 36, fontWeight: "800", marginBottom: 8, letterSpacing: -1 }}>
                        {workoutName}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, fontWeight: "500", marginBottom: 60 }}>
                        Workout crushed! 💎
                    </Text>

                    <View style={{ flexDirection: "row", gap: 32 }}>
                        <View>
                            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{duration}</Text>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" }}>MINUTES</Text>
                        </View>
                        <View>
                            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{calories}</Text>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" }}>KCAL</Text>
                        </View>
                    </View>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)", paddingTop: 20, alignItems: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>JOIN THE GRIND @ FITTRACK-PRO</Text>
                </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={{ width: "100%", marginTop: 40, gap: 16 }}>
              <Pressable 
                onPress={() => alert("Image saved to gallery!")}
                style={{ backgroundColor: colors.primary, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12 }}
              >
                  <Ionicons name="download-outline" size={24} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Download Card</Text>
              </Pressable>

              <Pressable 
                onPress={() => alert("Shared to Instagram Stories!")}
                style={{ backgroundColor: colors.surface, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12, borderWidth: 1, borderColor: colors.border }}
              >
                  <Ionicons name="logo-instagram" size={24} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>Instagram Story</Text>
              </Pressable>
          </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  shareCard: {
    flex: 1,
    borderRadius: 32,
    padding: 32,
    justifyContent: "space-between",
  }
});
