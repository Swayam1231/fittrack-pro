type ProfileInput = {
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  bodyFat?: number;
  goal: "cut" | "maintain" | "bulk";
  activityLevel: "sedentary" | "light" | "moderate" | "high" | "athlete";
};

export function calculateTargets(data: ProfileInput) {
  const { gender, age, height, weight, bodyFat, goal, activityLevel } = data;

  // BMR
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  // Activity
  const activityMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
    athlete: 1.9,
  };

  const tdee = bmr * activityMap[activityLevel];

  // Goal
  const goalFactor = goal === "cut" ? 0.8 : goal === "bulk" ? 1.1 : 1.0;
  const calories = Math.round(tdee * goalFactor);

  // Lean mass
  const lbm = bodyFat ? weight * (1 - bodyFat / 100) : weight * 0.8;

  // Protein
  const protein = Math.round(lbm * 2.2);

  // Fat
  const fatCalories = calories * 0.25;
  const fats = Math.round(fatCalories / 9);

  // Carbs
  const remainingCalories = calories - (protein * 4 + fatCalories);
  const carbs = Math.round(remainingCalories / 4);

  return { calories, protein, carbs, fats };
}
