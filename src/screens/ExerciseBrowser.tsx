import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";

const BODY_PARTS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "waist",
  "full body",
];

export default function ExerciseBrowser() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    exercises,
    loading: catalogLoading,
    search,
  } = useExerciseCatalog();

  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Initial load or when filters change
  useEffect(() => {
    search({
      search: searchText,
      bodyPart: selectedBodyPart === "full body" ? null : selectedBodyPart,
      equipment: equipmentFilter === "all" ? null : equipmentFilter,
    });
  }, [searchText, selectedBodyPart, equipmentFilter, search]);

  /* ---------------- UNIQUE FILTER VALUES (from currently loaded exercises) ---------------- */

  const uniqueEquipments = useMemo(
    () => ["all", ...new Set(exercises.map((e) => e.equipment))],
    [exercises]
  );

  const uniqueDifficulties = useMemo(
    () => ["all", ...new Set(exercises.map((e) => e.difficulty))],
    [exercises]
  );

  const uniqueCategories = useMemo(
    () => ["all", ...new Set(exercises.map((e) => e.category))],
    [exercises]
  );

  /* ---------------- UI ---------------- */

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary, paddingTop: insets.top }]}>
        Exercise Browser
      </Text>

      {/* BODY PART SELECT */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bodyPartScroll}>
        <View style={styles.bodyPartContainer}>
          {BODY_PARTS.map((bp) => (
            <Pressable
              key={bp}
              onPress={() => setSelectedBodyPart(bp)}
              style={[
                styles.bodyPartButton,
                {
                  backgroundColor:
                    selectedBodyPart === bp ? colors.accent : colors.card,
                },
              ]}
            >
              <Text
                style={{
                  color: selectedBodyPart === bp ? "#fff" : colors.textPrimary,
                  fontWeight: "600",
                }}
              >
                {bp.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.filterSection}>
        {/* SEARCH INPUT */}
        <TextInput
          placeholder="Search exercises..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          style={[
            styles.searchInput,
            { backgroundColor: colors.card, color: colors.textPrimary },
          ]}
        />

        {/* DROPDOWN FILTERS */}
        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={equipmentFilter}
            onValueChange={(itemValue) => setEquipmentFilter(itemValue)}
            style={[styles.picker, { color: colors.textPrimary, backgroundColor: colors.card }]}
            itemStyle={{ color: colors.textPrimary }}
          >
            {uniqueEquipments.map((e) => (
              <Picker.Item key={e} label={e.charAt(0).toUpperCase() + e.slice(1)} value={e} />
            ))}
          </Picker>

          <Picker
            selectedValue={difficultyFilter}
            onValueChange={(itemValue) => setDifficultyFilter(itemValue)}
            style={[styles.picker, { color: colors.textPrimary, backgroundColor: colors.card }]}
            itemStyle={{ color: colors.textPrimary }}
          >
            {uniqueDifficulties.map((d) => (
              <Picker.Item key={d} label={d.charAt(0).toUpperCase() + d.slice(1)} value={d} />
            ))}
          </Picker>

          <Picker
            selectedValue={categoryFilter}
            onValueChange={(itemValue) => setCategoryFilter(itemValue)}
            style={[styles.picker, { color: colors.textPrimary, backgroundColor: colors.card }]}
            itemStyle={{ color: colors.textPrimary }}
          >
            {uniqueCategories.map((c) => (
              <Picker.Item key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} value={c} />
            ))}
          </Picker>
        </View>
      </View>

      {/* RESULTS */}
      {catalogLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.exerciseItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
                {item.target} | {item.equipment} | {item.difficulty} | {item.category}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No exercises found.</Text>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  bodyPartScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bodyPartContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
  },
  bodyPartButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  dropdownContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  picker: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    marginRight: 8,
  },
  exerciseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exerciseName: {
    fontWeight: "600",
  },
  exerciseDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
  },
});

