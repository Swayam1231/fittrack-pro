
/* ===================== STATIC IMPORTS (EXPO SAFE) ===================== */

import chest from "../data/exercise-db/chest.json";
import back from "../data/exercise-db/back.json";
import legs from "../data/exercise-db/legs.json";
import shoulders from "../data/exercise-db/shoulders.json";
import arms from "../data/exercise-db/arms.json";
import waist from "../data/exercise-db/waist.json";

/* ===================== TYPES ===================== */

export type Exercise = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  difficulty: string;
  category: string;
};

type ExerciseFile = {
  version: string;
  bodyPart: string;
  count: number;
  exercises: Exercise[];
};


/* ===================== FILE MAP ===================== */

const FILE_MAP: Record<string, ExerciseFile> = {
  chest,
  back,
  legs,
  shoulders,
  arms,
  waist,
};

/* ===================== CACHE ===================== */

const cache: Record<string, Exercise[]> = {};

/* ===================== LOADER ===================== */

export async function loadExercisesByBodyPart(
  bodyPart: string
): Promise<Exercise[]> {
  const key = bodyPart.toLowerCase().replace(/\s+/g, "-");

  // ✅ Cached
  if (cache[key]) {
    return cache[key];
  }

  // ✅ Virtual "full body" (merge all)
  if (key === "full-body" || key === "full") {
    const merged = Object.values(FILE_MAP).flatMap(
      (file) => file.exercises
    );

    cache[key] = merged;
    return merged;
  }

  // ✅ Normal body part
  const file = FILE_MAP[key];

  if (!file) {
    throw new Error(`Exercise file not found for body part: ${bodyPart}`);
  }

  cache[key] = file.exercises;
  return cache[key];
}
