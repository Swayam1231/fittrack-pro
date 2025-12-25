import { View, Text, Pressable } from "react-native";
import { useTheme } from "../context/ThemeContext"; // ✅ added

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme(); // ✅ added

  return (
    <View style={{ flexDirection: "row", borderRadius: 10, overflow: "hidden" }}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: 12,
            backgroundColor:
              value === opt.value ? colors.accent : colors.border, // ✅
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color:
                value === opt.value ? "#fff" : colors.textPrimary, // ✅
              fontWeight: "600",
            }}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
