/**
 * Food Matcher for Custom Model Predictions
 * Maps AI predictions (40 Indian food classes) to food library items
 */

import { FOOD_LIBRARY } from "../data/foodLibraryData";
import { FoodLibraryItem } from "../data/foodLibrary";
import {
  getFoodLabels as getSupportedFoods,
  formatFoodLabel,
} from "./customFoodModel";

/**
 * Match a predicted label to food library
 * @param label - AI predicted label (e.g., "butter_chicken", "dosa")
 * @returns Matching food item from library, or null if not found
 */
export function matchFoodLabel(label: string): FoodLibraryItem | null {
  const normalized = label.toLowerCase().replace(/_/g, ' ').trim();

  console.log("🔍 Matching AI label to library:", normalized);

  // Step 1: Direct ID match
  // If your food library uses same IDs as model labels
  const directMatch = FOOD_LIBRARY.find(
    food => food.id.toLowerCase() === label.toLowerCase()
  );

  if (directMatch) {
    console.log("✅ Direct ID match:", directMatch.name);
    return directMatch;
  }

  // Step 2: Exact name match (case-insensitive)
  const exactMatch = FOOD_LIBRARY.find(
    food => food.name.toLowerCase() === normalized
  );

  if (exactMatch) {
    console.log("✅ Exact name match:", exactMatch.name);
    return exactMatch;
  }

  // Step 3: Contains match
  // e.g., "butter_chicken" matches "Butter Chicken Curry"
  const containsMatch = FOOD_LIBRARY.find(
    food => {
      const foodName = food.name.toLowerCase();
      return foodName.includes(normalized) || normalized.includes(foodName);
    }
  );

  if (containsMatch) {
    console.log("✅ Contains match:", containsMatch.name);
    return containsMatch;
  }

  // Step 4: Word-based fuzzy match
  const words = normalized.split(/\s+/);
  
  for (const food of FOOD_LIBRARY) {
    const foodWords = food.name.toLowerCase().split(/\s+/);
    
    // Count matching words
    let matches = 0;
    for (const word of words) {
      if (foodWords.some(fw => fw.includes(word) || word.includes(fw))) {
        matches++;
      }
    }
    
    // If most words match, consider it a match
    if (matches >= Math.min(words.length, foodWords.length) * 0.7) {
      console.log(`✅ Fuzzy match (${matches}/${words.length} words):`, food.name);
      return food;
    }
  }

  console.log("❌ No match found for:", label);
  return null;
}

/**
 * Check if a food is supported by the AI model
 * @param foodName - Food name to check
 * @returns true if model can recognize this food
 */
export function isSupportedFood(foodName: string): boolean {
  const normalized = foodName.toLowerCase().replace(/\s+/g, "_");
  return getSupportedFoods().includes(normalized);
}

/**
 * Get all supported AI food labels
 */
export { getSupportedFoods };

/**
 * Format AI label to human-readable name
 * @param label - Raw label like "butter_chicken"
 * @returns Formatted name like "Butter Chicken"
 */
export function getSuggestion(label: string): string {
  const formatted = formatFoodLabel(label);
  
  // Provide default nutritional estimates based on food type
  const suggestions: Record<string, any> = {
    // Breads
    roti: { calories: 120, protein: 3, carbs: 24, fats: 2 },
    paratha: { calories: 200, protein: 4, carbs: 30, fats: 8 },
    naan: { calories: 262, protein: 9, carbs: 45, fats: 5 },
    
    // Rice
    plain_rice: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    jeera_rice: { calories: 150, protein: 3, carbs: 30, fats: 2 },
    
    // Curries
    butter_chicken: { calories: 240, protein: 15, carbs: 8, fats: 18 },
    chicken_curry: { calories: 180, protein: 14, carbs: 10, fats: 10 },
    paneer_butter_masala: { calories: 265, protein: 12, carbs: 15, fats: 18 },
    
    // Snacks
    samosa: { calories: 262, protein: 5, carbs: 35, fats: 12 },
    pakoda: { calories: 235, protein: 6, carbs: 24, fats: 14 },
    
    // Sweets
    gulab_jamun: { calories: 175, protein: 3, carbs: 28, fats: 7 },
    jalebi: { calories: 150, protein: 1, carbs: 35, fats: 1 },
  };

  const key = label.toLowerCase();
  const estimate = suggestions[key];

  if (estimate) {
    return `Add "${formatted}" to your library:\nCalories: ${estimate.calories}/100g\nProtein: ${estimate.protein}g\nCarbs: ${estimate.carbs}g\nFats: ${estimate.fats}g`;
  }

  return `Add "${formatted}" to your food library to track it.`;
}