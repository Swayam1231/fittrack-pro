import { View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
