import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { ExerciseCatalogItem } from "../hooks/useExerciseCatalog";
import { useTheme } from "../context/ThemeContext"; // ✅ added

/* ===================== TYPES ===================== */

type Props = {
  visible: boolean;
  search: string;
  setSearch: (v: string) => void;
  availableMuscles: string[];
  availableEquipment: string[];
  muscleFilter: string | null;
  equipmentFilter: string | null;
  setMuscleFilter: (v: string | null) => void;
  setEquipmentFilter: (v: string | null) => void;
  data: ExerciseCatalogItem[];
  onSelect: (name: string) => void;
  onClose: () => void;
};

/* ===================== COMPONENT ===================== */

export function ExercisePickerModal(props: Props) {
  const { colors } = useTheme(); // ✅ added

  return (
    <Modal visible={props.visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <Text
            style={[
              styles.modalTitle,
              { color: colors.textPrimary }, // ✅
            ]}
          >
            Select Exercise
          </Text>

          <TextInput
            placeholder="Search exercise"
            value={props.search}
            onChangeText={props.setSearch}
            style={[
              styles.searchInput,
              { backgroundColor: colors.background, color: colors.textPrimary }, // ✅
            ]}
            placeholderTextColor={colors.textSecondary} // ✅
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {props.availableMuscles.map((m) => (
              <Pressable
                key={m}
                onPress={() =>
                  props.setMuscleFilter(
                    props.muscleFilter === m ? null : m
                  )
                }
                style={[
                  styles.chip,
                  { backgroundColor: colors.border }, // ✅
                  props.muscleFilter === m && {
                    backgroundColor: colors.accent, // ✅
                  },
                ]}
              >
                <Text style={{ color: colors.textPrimary }}>
                  {m}
                </Text>
              </Pressable>
            ))}

            {props.availableEquipment.map((e) => (
              <Pressable
                key={e}
                onPress={() =>
                  props.setEquipmentFilter(
                    props.equipmentFilter === e ? null : e
                  )
                }
                style={[
                  styles.chip,
                  { backgroundColor: colors.border }, // ✅
                  props.equipmentFilter === e && {
                    backgroundColor: colors.accent, // ✅
                  },
                ]}
              >
                <Text style={{ color: colors.textPrimary }}>
                  {e}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={props.data}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.exerciseItem,
                { borderBottomColor: colors.border }, // ✅
              ]}
              onPress={() => props.onSelect(item.name)}
            >
              <Text style={{ color: colors.textPrimary }}>
                {item.name}
              </Text>
              <Text
                style={[
                  styles.exerciseMeta,
                  { color: colors.textSecondary }, // ✅
                ]}
              >
                {item.target} · {item.equipment}
              </Text>
            </Pressable>
          )}
        />

        <View style={{ padding: 16 }}>
          <Pressable
            onPress={props.onClose}
            style={[
              styles.closeButton,
              { backgroundColor: colors.border }, // ✅
            ]}
          >
            <Text
              style={[
                styles.closeText,
                { color: colors.textPrimary }, // ✅
              ]}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  searchInput: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 18,
    marginRight: 8,
  },
  exerciseItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  exerciseMeta: {
    fontSize: 12,
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: {
    fontWeight: "600",
  },
});
