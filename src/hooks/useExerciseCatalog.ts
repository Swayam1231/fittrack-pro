import { useCallback, useState } from "react";
import exercisesData from "../data/exercises.json";

/* ===================== TYPES ===================== */

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  bodyPart: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipment: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  movementType: "Compound" | "Isolation";
  forceType?: "Push" | "Pull" | "Static";
  target?: string; // Legacy support
  score?: number;  // Ranking score
}

export interface ExerciseFilters {
  query?: string;
  search?: string; // Compatibility with legacy calls
  bodyPart?: string | null;
  muscles?: string[] | string | null;
  equipment?: string[] | string | null;
  difficulty?: string[] | string | null;
  movementType?: string[] | string | null;
}

/* ===================== HELPERS ===================== */

const toArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

const safeExercises = (Array.isArray(exercisesData) ? exercisesData : []).filter(Boolean) as ExerciseCatalogItem[];

/* ===================== FILTER & RANKING LOGIC ===================== */

export const searchExercises = (
  exercises: ExerciseCatalogItem[],
  filters: ExerciseFilters
): ExerciseCatalogItem[] => {
  if (!Array.isArray(exercises)) return [];
  const f = filters || {};

  const {
    query,
    search,
    bodyPart,
  } = f;

  const muscles = toArray(f.muscles);
  const equipment = toArray(f.equipment);
  const difficulty = toArray(f.difficulty);
  const movementType = toArray(f.movementType);

  const q = (query || search)?.trim().toLowerCase();

  return exercises
    .map((ex) => {
      if (!ex) return null;
      let score = 0;

      // 🔎 Text relevance scoring
      if (q) {
        const name = ex.name?.toLowerCase() || "";
        if (name === q) score += 10;
        else if (name.includes(q)) score += 5;
        
        if (ex.primaryMuscles && Array.isArray(ex.primaryMuscles)) {
          if (ex.primaryMuscles.some((m) => m && typeof m === "string" && m.toLowerCase().includes(q))) score += 3;
        }
        if (ex.secondaryMuscles && Array.isArray(ex.secondaryMuscles)) {
          if (ex.secondaryMuscles.some((m) => m && typeof m === "string" && m.toLowerCase().includes(q))) score += 2;
        }
        const equip = ex.equipment?.toLowerCase() || "";
        if (equip.includes(q)) score += 1;
      }

      // 🧠 Compound priority boost
      if (ex.movementType === "Compound") score += 2;

      return { ...ex, score };
    })
    .filter((ex): ex is ExerciseCatalogItem & { score: number } => {
      if (!ex || !ex.id) return false;

      // 🧍 Body Part Filter
      if (bodyPart && bodyPart.toLowerCase() !== "all") {
        if (!ex.bodyPart || ex.bodyPart.toLowerCase() !== bodyPart.toLowerCase()) return false;
      }

      // 💪 Multi-select Muscle Filter
      if (muscles.length > 0) {
        const matches = muscles.some(
          (m) =>
            (ex.primaryMuscles && Array.isArray(ex.primaryMuscles) && ex.primaryMuscles.includes(m)) || 
            (ex.secondaryMuscles && Array.isArray(ex.secondaryMuscles) && ex.secondaryMuscles.includes(m))
        );
        if (!matches) return false;
      }

      // 🏋 Multi-select Equipment Filter
      if (equipment.length > 0) {
        if (!ex.equipment || !equipment.includes(ex.equipment)) return false;
      }

      // 📈 Multi-select Difficulty Filter
      if (difficulty.length > 0) {
        if (!ex.difficulty || !difficulty.includes(ex.difficulty)) return false;
      }

      // 🔁 Multi-select Movement Type Filter
      if (movementType.length > 0) {
        if (!ex.movementType || !movementType.includes(ex.movementType)) return false;
      }

      return true;
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0) || (a.name || "").localeCompare(b.name || ""));
};

/* ===================== HOOK ===================== */

export function useExerciseCatalog() {
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>(safeExercises);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (filters: ExerciseFilters = {}) => {
    setLoading(true);
    const results = searchExercises(safeExercises, filters);
    setExercises(results);
    setLoading(false);
  }, []);

  return {
    exercises,
    loading,
    hasMore: false,
    loadMore: () => {},
    search,
  };
}
