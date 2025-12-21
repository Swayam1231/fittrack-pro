import { View, Text, Pressable } from "react-native";

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
  return (
    <View style={{ flexDirection: "row", borderRadius: 10, overflow: "hidden" }}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: value === opt.value ? "#2563EB" : "#E5E7EB",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: value === opt.value ? "#fff" : "#111",
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
