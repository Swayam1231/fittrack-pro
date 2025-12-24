import { useEffect, useState } from "react";
import exercisesData from "../data/exercises.json";

/* 🔹 Explicit type */
export type ExerciseCatalogItem = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
};

export function useExerciseCatalog() {
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setExercises(exercisesData as ExerciseCatalogItem[]);
    setLoading(false);
  }, []);

  return {
    exercises,
    loading,
  };
}
