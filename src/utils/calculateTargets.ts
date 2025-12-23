type ProfileInput = {
  gender: "male" | "female";
  age: number;
  height: number; // cm
  weight: number; // kg
  bodyFat?: number;
  goal: "cut" | "maintain" | "bulk";
  activityLevel: "sedentary" | "light" | "moderate" | "high" | "athlete";
};

export function calculateTargets(data: ProfileInput) {
  const {
    gender,
    age,
    height,
    weight,
    bodyFat,
    goal,
    activityLevel,
  } = data;

  /* ================= BMR ================= */
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  /* ================= ACTIVITY ================= */
  const activityMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
    athlete: 1.9,
  };

  const tdee = bmr * activityMap[activityLevel];

  /* ================= CALORIES ================= */
  const goalFactor =
    goal === "cut"
      ? 0.8
      : goal === "bulk"
      ? 1.1
      : 1.0;

  const calories = Math.round(tdee * goalFactor);

  /* ================= LEAN MASS ================= */
  const leanMass =
    bodyFat !== undefined
      ? weight * (1 - bodyFat / 100)
      : goal === "cut"
      ? weight * 0.75
      : weight * 0.8;

  /* ================= PROTEIN ================= */
  const proteinMultiplier =
    goal === "cut"
      ? 2.4
      : goal === "bulk"
      ? 2.3
      : 2.0;

  const protein = Math.round(leanMass * proteinMultiplier);

  const proteinCalories = protein * 4;

  /* ================= FAT (REBALANCED) ================= */
  // Minimum fat: 0.8 g/kg bodyweight
  const minFatGrams = Math.round(weight * 0.8);
  const fatCalories = minFatGrams * 9;

  /* ================= CARBS ================= */
  let remainingCalories =
    calories - (proteinCalories + fatCalories);

  // Safety check: if calories too low, reduce fat slightly (never protein)
  if (remainingCalories < calories * 0.2) {
    remainingCalories = calories * 0.2;
  }

  const carbs = Math.round(remainingCalories / 4);

  /* ================= RETURN ================= */
  return {
    calories,
    protein,
    carbs,
    fats: minFatGrams,
  };
}
