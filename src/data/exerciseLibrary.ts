import { ExerciseCatalogItem } from "../hooks/useExerciseCatalog";

const baseExercises = [
  // --- CHEST ---
  { baseName: "Bench Press", bodyPart: "Chest", primary: ["Pectorals"], secondary: ["Triceps", "Anterior Deltoid"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Incline Bench Press", bodyPart: "Chest", primary: ["Upper Pectorals"], secondary: ["Triceps", "Anterior Deltoid"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Decline Bench Press", bodyPart: "Chest", primary: ["Lower Pectorals"], secondary: ["Triceps"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Flyes", bodyPart: "Chest", primary: ["Pectorals"], secondary: [], movementType: "Isolation" as const, forceType: "Push" as const },
  { baseName: "Push-ups", bodyPart: "Chest", primary: ["Pectorals"], secondary: ["Triceps", "Core"], equipmentOverride: ["Bodyweight", "Weighted", "Parallettes"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Dips", bodyPart: "Chest", primary: ["Lower Pectorals", "Triceps"], secondary: ["Anterior Deltoid"], equipmentOverride: ["Bodyweight", "Weighted", "Machine"], movementType: "Compound" as const, forceType: "Push" as const },

  // --- BACK ---
  { baseName: "Deadlift", bodyPart: "Back", primary: ["Lower Back", "Glutes", "Hamstrings"], secondary: ["Core", "Traps", "Forearms"], movementType: "Compound" as const, forceType: "Pull" as const },
  { baseName: "Pull-ups", bodyPart: "Back", primary: ["Lats"], secondary: ["Biceps", "Upper Back"], equipmentOverride: ["Bodyweight", "Weighted", "Machine"], movementType: "Compound" as const, forceType: "Pull" as const },
  { baseName: "Lat Pulldown", bodyPart: "Back", primary: ["Lats"], secondary: ["Biceps"], equipmentOverride: ["Cable", "Machine", "Resistance Band"], movementType: "Compound" as const, forceType: "Pull" as const },
  { baseName: "Bent Over Row", bodyPart: "Back", primary: ["Middle Back", "Lats"], secondary: ["Biceps", "Lower Back"], movementType: "Compound" as const, forceType: "Pull" as const },
  { baseName: "Seated Row", bodyPart: "Back", primary: ["Middle Back"], secondary: ["Biceps"], equipmentOverride: ["Cable", "Machine", "Resistance Band"], movementType: "Compound" as const, forceType: "Pull" as const },
  { baseName: "T-Bar Row", bodyPart: "Back", primary: ["Middle Back", "Lats"], secondary: ["Biceps"], equipmentOverride: ["Barbell", "Machine"], movementType: "Compound" as const, forceType: "Pull" as const },

  // --- LEGS ---
  { baseName: "Squat", bodyPart: "Legs", primary: ["Quads", "Glutes"], secondary: ["Hamstrings", "Lower Back", "Core"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Leg Press", bodyPart: "Legs", primary: ["Quads", "Glutes"], secondary: ["Hamstrings"], equipmentOverride: ["Machine"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Lunge", bodyPart: "Legs", primary: ["Quads", "Glutes"], secondary: ["Hamstrings"], equipmentOverride: ["Dumbbell", "Barbell", "Bodyweight", "Kettlebell"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Romanian Deadlift", bodyPart: "Legs", primary: ["Hamstrings", "Glutes"], secondary: ["Lower Back"], equipmentOverride: ["Barbell", "Dumbbell", "Kettlebell"], movementType: "Compound" as const, forceType: "Pull" as const },
  { baseName: "Leg Extension", bodyPart: "Legs", primary: ["Quads"], secondary: [], equipmentOverride: ["Machine", "Resistance Band"], movementType: "Isolation" as const, forceType: "Push" as const },
  { baseName: "Leg Curl", bodyPart: "Legs", primary: ["Hamstrings"], secondary: [], equipmentOverride: ["Machine", "Cable", "Resistance Band"], movementType: "Isolation" as const, forceType: "Pull" as const },

  // --- SHOULDERS ---
  { baseName: "Overhead Press", bodyPart: "Shoulders", primary: ["Anterior Deltoid"], secondary: ["Triceps", "Upper Chest"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Lateral Raise", bodyPart: "Shoulders", primary: ["Lateral Deltoid"], secondary: [], equipmentOverride: ["Dumbbell", "Cable", "Machine", "Resistance Band"], movementType: "Isolation" as const, forceType: "Push" as const },
  { baseName: "Front Raise", bodyPart: "Shoulders", primary: ["Anterior Deltoid"], secondary: [], equipmentOverride: ["Dumbbell", "Cable", "Barbell", "Resistance Band"], movementType: "Isolation" as const, forceType: "Push" as const },
  { baseName: "Reverse Fly", bodyPart: "Shoulders", primary: ["Rear Deltoid"], secondary: ["Traps", "Rhomboids"], equipmentOverride: ["Dumbbell", "Cable", "Machine"], movementType: "Isolation" as const, forceType: "Pull" as const },

  // --- ARMS ---
  { baseName: "Bicep Curl", bodyPart: "Arms", primary: ["Biceps"], secondary: ["Forearms"], equipmentOverride: ["Barbell", "Dumbbell", "Cable", "EZ Bar", "Machine"], movementType: "Isolation" as const, forceType: "Pull" as const },
  { baseName: "Tricep Pushdown", bodyPart: "Arms", primary: ["Triceps"], secondary: [], equipmentOverride: ["Cable", "Resistance Band"], movementType: "Isolation" as const, forceType: "Push" as const },
  { baseName: "Hammer Curl", bodyPart: "Arms", primary: ["Brachialis", "Biceps"], secondary: ["Forearms"], equipmentOverride: ["Dumbbell", "Cable", "Kettlebell"], movementType: "Isolation" as const, forceType: "Pull" as const },
  { baseName: "Tricep Extension", bodyPart: "Arms", primary: ["Triceps"], secondary: [], equipmentOverride: ["Dumbbell", "Cable", "EZ Bar"], movementType: "Isolation" as const, forceType: "Push" as const },

  // --- GLUTES ---
  { baseName: "Hip Thrust", bodyPart: "Glutes", primary: ["Glutes"], secondary: ["Hamstrings"], equipmentOverride: ["Barbell", "Dumbbell", "Machine", "Bodyweight"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Glute Kickback", bodyPart: "Glutes", primary: ["Glutes"], secondary: ["Hamstrings"], equipmentOverride: ["Cable", "Resistance Band", "Machine", "Bodyweight"], movementType: "Isolation" as const, forceType: "Push" as const },

  // --- CORE ---
  { baseName: "Plank", bodyPart: "Core", primary: ["Abs"], secondary: ["Lower Back", "Shoulders"], equipmentOverride: ["Bodyweight", "Weighted"], movementType: "Isolation" as const, forceType: "Static" as const },
  { baseName: "Leg Raises", bodyPart: "Core", primary: ["Lower Abs"], secondary: ["Hip Flexors"], equipmentOverride: ["Bodyweight", "Weighted"], movementType: "Isolation" as const, forceType: "Pull" as const },
  { baseName: "Russian Twist", bodyPart: "Core", primary: ["Obliques"], secondary: ["Abs"], equipmentOverride: ["Bodyweight", "Medicine Ball", "Dumbbell"], movementType: "Isolation" as const, forceType: "Static" as const },

  // --- TRAPS ---
  { baseName: "Shrugs", bodyPart: "Traps", primary: ["Traps"], secondary: ["Forearms"], equipmentOverride: ["Dumbbell", "Barbell", "Cable", "Machine", "Kettlebell"], movementType: "Isolation" as const, forceType: "Pull" as const },

  // --- FOREARMS ---
  { baseName: "Wrist Curl", bodyPart: "Forearms", primary: ["Forearm Flexors"], secondary: [], equipmentOverride: ["Barbell", "Dumbbell", "Cable"], movementType: "Isolation" as const, forceType: "Pull" as const },
  { baseName: "Reverse Wrist Curl", bodyPart: "Forearms", primary: ["Forearm Extensors"], secondary: [], equipmentOverride: ["Barbell", "Dumbbell", "Cable"], movementType: "Isolation" as const, forceType: "Pull" as const },

  // --- CARDIO ---
  { baseName: "Running", bodyPart: "Cardio", primary: ["Heart", "Lungs"], secondary: ["Legs"], equipmentOverride: ["Outdoor", "Treadmill"], movementType: "Compound" as const, forceType: "Static" as const },
  { baseName: "Cycling", bodyPart: "Cardio", primary: ["Heart", "Lungs"], secondary: ["Legs"], equipmentOverride: ["Outdoor", "Stationary Bike"], movementType: "Compound" as const, forceType: "Static" as const },
  { baseName: "Rowing", bodyPart: "Cardio", primary: ["Heart", "Full Body"], secondary: ["Back", "Legs", "Arms"], equipmentOverride: ["Machine"], movementType: "Compound" as const, forceType: "Pull" as const },

  // --- FULL BODY ---
  { baseName: "Burpees", bodyPart: "Full Body", primary: ["Full Body"], secondary: ["Heart", "Lungs"], equipmentOverride: ["Bodyweight"], movementType: "Compound" as const, forceType: "Push" as const },
  { baseName: "Kettlebell Swings", bodyPart: "Full Body", primary: ["Full Body", "Glutes", "Hamstrings"], secondary: ["Shoulders", "Core"], equipmentOverride: ["Kettlebell", "Dumbbell"], movementType: "Compound" as const, forceType: "Pull" as const },
];

const DEFAULT_EQUIPMENT_TYPES = [
  "Barbell", 
  "Dumbbell", 
  "Smith Machine", 
  "Cable", 
  "Resistance Band", 
  "Kettlebell",
  "Machine"
];

// Dynamically generate the library
export const EXERCISE_LIBRARY: ExerciseCatalogItem[] = baseExercises.flatMap((ex, index) => {
  const equipments = ex.equipmentOverride || DEFAULT_EQUIPMENT_TYPES;
  
  return equipments.map((equipment, i) => ({
    id: `${ex.bodyPart.toLowerCase().substring(0, 3)}-${index}-${i}`,
    name: `${ex.baseName} (${equipment})`,
    bodyPart: ex.bodyPart,
    target: ex.primary.join(", "),
    primaryMuscles: ex.primary,
    secondaryMuscles: ex.secondary,
    equipment,
    difficulty: "Intermediate",
    movementType: ex.movementType,
    forceType: ex.forceType
  }));
});

export const searchExercises = (queryText: string, bodyPart?: string | null): ExerciseCatalogItem[] => {
  let results = EXERCISE_LIBRARY;

  if (bodyPart && bodyPart.toLowerCase() !== "all") {
    results = results.filter(ex => ex.bodyPart.toLowerCase() === bodyPart.toLowerCase());
  }

  if (queryText.trim()) {
    const q = queryText.toLowerCase().trim();
    results = results.filter(ex => 
      ex.name.toLowerCase().includes(q) || 
      (ex.target && ex.target.toLowerCase().includes(q)) ||
      ex.equipment.toLowerCase().includes(q)
    );
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
};
