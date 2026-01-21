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
import { useTheme } from "../context/ThemeContext";
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
  loading: boolean;
  onLoadMore: () => void;
  onSelect: (name: string) => void;
  onClose: () => void;
};

/* ===================== COMPONENT ===================== */

export function ExercisePickerModal(props: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={props.visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* HEADER */}
        <View style={{ padding: 16 }}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Select Exercise
          </Text>

          <TextInput
            placeholder="Search exercise"
            value={props.search}
            onChangeText={props.setSearch}
            style={[
              styles.searchInput,
              { backgroundColor: colors.card, color: colors.textPrimary },
            ]}
            placeholderTextColor={colors.textSecondary}
          />

          {/* FILTER CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {props.availableMuscles.map((m) => {
              const selected = props.muscleFilter === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => props.setMuscleFilter(selected ? null : m)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? "#fff" : colors.textPrimary,
                      fontWeight: "600",
                    }}
                  >
                    {m}
                  </Text>
                </Pressable>
              );
            })}

            {props.availableEquipment.map((e) => {
              const selected = props.equipmentFilter === e;
              return (
                <Pressable
                  key={e}
                  onPress={() =>
                    props.setEquipmentFilter(selected ? null : e)
                  }
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? "#fff" : colors.textPrimary,
                      fontWeight: "600",
                    }}
                  >
                    {e}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* LIST */}
        <FlatList
          data={props.data}
          keyExtractor={(i) => i.id}
          onEndReached={props.onLoadMore}
          onEndReachedThreshold={0.6}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.exerciseItem,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => props.onSelect(item.name)}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                {item.name}
              </Text>
              <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                {item.target} · {item.equipment}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={
            props.loading ? (
              <Text style={{ textAlign: "center", padding: 16, color: colors.textSecondary }}>
                Loading...
              </Text>
            ) : null
          }
        />

        {/* FOOTER */}
        <View style={{ padding: 16 }}>
          <Pressable
            onPress={props.onClose}
            style={[styles.closeButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.closeText, { color: colors.textPrimary }]}>
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
    marginTop: 2,
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
