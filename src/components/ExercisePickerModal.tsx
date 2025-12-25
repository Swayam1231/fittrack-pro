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
  return (
    <Modal visible={props.visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <Text style={styles.modalTitle}>Select Exercise</Text>

          <TextInput
            placeholder="Search exercise"
            value={props.search}
            onChangeText={props.setSearch}
            style={styles.searchInput}
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
                  props.muscleFilter === m && styles.chipActive,
                ]}
              >
                <Text>{m}</Text>
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
                  props.equipmentFilter === e && styles.chipActive,
                ]}
              >
                <Text>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={props.data}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.exerciseItem}
              onPress={() => props.onSelect(item.name)}
            >
              <Text>{item.name}</Text>
              <Text style={styles.exerciseMeta}>
                {item.target} · {item.equipment}
              </Text>
            </Pressable>
          )}
        />

        <View style={{ padding: 16 }}>
          <Pressable onPress={props.onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
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
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 18,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#93C5FD",
  },
  exerciseItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  exerciseMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  closeButton: {
    padding: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: {
    fontWeight: "600",
  },
});
