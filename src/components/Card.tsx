import { View, StyleSheet, ViewStyle } from "react-native";
import { ReactNode } from "react";
import { useTheme } from "../context/ThemeContext";

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  variant?: "glass" | "solid" | "tonal";
};

export function Card({ children, style, variant = "tonal" }: CardProps) {
  const { colors, theme } = useTheme();

  const getBg = () => {
    if (variant === "glass") return theme === "light" ? "rgba(255,255,255,0.7)" : "rgba(25,25,25,0.7)";
    if (variant === "solid") return colors.surfaceContainerLowest;
    return colors.surfaceContainerLow; // Tonal
  };

  return (
    <View
      style={[
        styles.card,
        { 
          backgroundColor: getBg(),
          shadowColor: theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.5)",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    padding: 24,
    shadowOpacity: 1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: 'hidden',
  },
});
