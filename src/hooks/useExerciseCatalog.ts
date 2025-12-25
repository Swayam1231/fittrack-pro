import { useCallback, useEffect, useState } from "react";
import { loadExercisesByBodyPart } from "../utils/exerciseLoader";

/* ===================== TYPES ===================== */

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  difficulty: string;
  category: string;
};

/* ===================== HOOK ===================== */

export function useExerciseCatalog() {
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  /* 🔹 AUTO LOAD FULL BODY ON FIRST USE */
  useEffect(() => {
    if (initialized) return;

    setLoading(true);

    loadExercisesByBodyPart("full body")
      .then((data) => {
        setExercises(
          data.map((e) => ({
            id: e.id,
            name: e.name,
            bodyPart: e.bodyPart,
            target: e.target,
            equipment: e.equipment,
            difficulty: e.difficulty,
            category: e.category,
          }))
        );
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load exercise catalog");
      })
      .finally(() => {
        setLoading(false);
        setInitialized(true);
      });
  }, [initialized]);

  /* 🔹 OPTIONAL: load a specific body part if needed elsewhere */
  const loadByBodyPart = useCallback(async (bodyPart: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await loadExercisesByBodyPart(bodyPart);
      setExercises(
        data.map((e) => ({
          id: e.id,
          name: e.name,
          bodyPart: e.bodyPart,
          target: e.target,
          equipment: e.equipment,
          difficulty: e.difficulty,
          category: e.category,
        }))
      );
    } catch (err) {
      console.error(err);
      setExercises([]);
      setError("Failed to load exercises");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    exercises,
    loading,
    error,
    loadByBodyPart,
  };
}
