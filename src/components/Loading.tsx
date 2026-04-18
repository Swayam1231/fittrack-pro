import { View, Text, ActivityIndicator } from "react-native";
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence, useSharedValue, useEffect } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

export function Loading({ label = "Loading..." }: { label?: string }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <View style={{ marginBottom: 24 }}>
          <ActivityIndicator size="large" color={colors.primary} />
      </View>

      <Animated.Text
        style={[{
          fontSize: 16,
          fontWeight: "600",
          color: colors.textSecondary,
          letterSpacing: 0.5,
        }, animatedStyle]}
      >
        {label.toUpperCase()}
      </Animated.Text>
    </View>
  );
}
