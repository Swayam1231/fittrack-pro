import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { ExerciseCatalogItem } from "../hooks/useExerciseCatalog";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

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

export function ExercisePickerModal(props: Props) {
  const { colors, theme } = useTheme();

  return (
    <Modal visible={props.visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <SafeAreaView style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* HEADER */}
          <View style={styles.header}>
             <View style={styles.headerTop}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>Search Library</Text>
                <Pressable onPress={props.onClose} style={styles.closeBtn}>
                   <Ionicons name="close" size={24} color={colors.textPrimary} />
                </Pressable>
             </View>

             <View style={[styles.searchBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  placeholder="Body part, equipment, or name..."
                  value={props.search}
                  onChangeText={props.setSearch}
                  style={[styles.searchInput, { color: colors.textPrimary, fontFamily: 'Manrope-Medium' }]}
                  placeholderTextColor={colors.onSurfaceVariant}
                />
             </View>

             {/* FILTER CHIPS */}
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
               {props.availableMuscles.map((m) => {
                 const selected = props.muscleFilter === m;
                 if (!m) return null;
                 return (
                   <Pressable
                     key={m}
                     onPress={() => props.setMuscleFilter(selected ? null : m)}
                     style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceContainerLow }]}
                   >
                     <Text style={[styles.chipText, { color: selected ? "#fff" : colors.textPrimary, fontFamily: 'Manrope-Bold' }]}>{m}</Text>
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
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.exerciseItem, { backgroundColor: colors.surfaceContainerLowest }]}
                onPress={() => props.onSelect(item.name)}
              >
                <View>
                   <Text style={[styles.itemName, { color: colors.textPrimary, fontFamily: 'SpaceGrotesk-Bold' }]}>{item.name}</Text>
                   <Text style={[styles.itemMeta, { color: colors.textSecondary, fontFamily: 'Manrope-Medium' }]}>
                     {item.bodyPart} • {item.equipment}
                   </Text>
                </View>
                <Ionicons name="add-circle" size={20} color={colors.primary} />
              </Pressable>
            )}
            ListEmptyComponent={
              props.loading ? (
                <Text style={[styles.empty, { color: colors.textSecondary }]}>Calibrating Catalog...</Text>
              ) : (
                <Text style={[styles.empty, { color: colors.textSecondary }]}>No matching movements found.</Text>
              )
            }
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: { height: '85%', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  header: { padding: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, letterSpacing: -0.5 },
  closeBtn: { padding: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 28, paddingHorizontal: 20, gap: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  chipScroll: { paddingVertical: 12, gap: 8 },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: 'center' },
  chipText: { fontSize: 12 },
  list: { paddingHorizontal: 24, gap: 12 },
  exerciseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20 },
  itemName: { fontSize: 17, letterSpacing: -0.3 },
  itemMeta: { fontSize: 12, marginTop: 2, opacity: 0.6 },
  empty: { textAlign: 'center', marginTop: 40, opacity: 0.5 },
});
