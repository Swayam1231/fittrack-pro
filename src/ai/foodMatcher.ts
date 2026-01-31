/**
 * Food Matcher Service
 * Matches ML Kit labels to actual food items in the library
 */

import { FoodLibraryItem } from "../data/foodLibrary";
import { FOOD_LIBRARY } from "../data/foodLibraryData";

/**
 * Calculate similarity score between two strings (0-1)
 * Uses a simple word overlap algorithm
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matches++;
      }
    }
  }

  const maxWords = Math.max(words1.length, words2.length);
  return maxWords > 0 ? matches / maxWords : 0;
}

/**
 * Match a detected label to food library items
 * @param label - Detected label from ML Kit (e.g., "rice", "chicken", "bread")
 * @returns Best matching food item, or null if no good match
 */
export function matchFoodLabel(label: string): FoodLibraryItem | null {
  const normalized = label.toLowerCase().trim();

  console.log("🔍 Matching label:", normalized);

  // Common label mappings for Indian foods
  const labelMappings: Record<string, string[]> = {
    rice: ["rice", "biryani", "pulao", "fried rice"],
    bread: ["roti", "naan", "paratha", "chapati", "kulcha"],
    chicken: ["chicken", "murgh"],
    curry: ["curry", "gravy", "masala"],
    vegetable: ["sabzi", "vegetables"],
    lentil: ["dal", "daal", "lentils"],
    yogurt: ["curd", "dahi", "raita"],
    cheese: ["paneer"],
    dumpling: ["momos", "samosa"],
    egg: ["egg", "omelette", "bhurji"],
  };

  // Step 1: Check label mappings for quick matches
  for (const [key, alternatives] of Object.entries(labelMappings)) {
    if (normalized.includes(key)) {
      // Search for any alternative in food library
      for (const alt of alternatives) {
        const match = FOOD_LIBRARY.find((food) =>
          food.name.toLowerCase().includes(alt),
        );
        if (match) {
          console.log(`✅ Quick match via mapping: ${match.name}`);
          return match;
        }
      }
    }
  }

  // Step 2: Direct substring match
  for (const food of FOOD_LIBRARY) {
    const foodName = food.name.toLowerCase();

    // Check if label is in food name or vice versa
    if (foodName.includes(normalized) || normalized.includes(foodName)) {
      console.log(`✅ Direct substring match: ${food.name}`);
      return food;
    }
  }

  // Step 3: Word-based fuzzy match
  let bestMatch: FoodLibraryItem | null = null;
  let bestScore = 0;

  const words = normalized.split(/\s+/).filter((w) => w.length >= 3);

  for (const food of FOOD_LIBRARY) {
    const foodName = food.name.toLowerCase();

    // Check each word
    for (const word of words) {
      if (foodName.includes(word)) {
        const similarity = calculateSimilarity(normalized, foodName);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = food;
        }
      }
    }
  }

  // Only return if confidence is decent
  if (bestScore > 0.3) {
    console.log(`✅ Fuzzy match (${bestScore.toFixed(2)}): ${bestMatch?.name}`);
    return bestMatch;
  }

  console.log("❌ No match found for:", normalized);
  return null;
}

/**
 * Match multiple labels and return best match
 * @param labels - Array of detected labels with confidence scores
 * @returns Best matching food item across all labels
 */
export function matchMultipleLabels(
  labels: { label: string; confidence: number }[],
): FoodLibraryItem | null {
  console.log("🔍 Matching multiple labels:", labels);

  // Try each label in order of confidence
  for (const { label, confidence } of labels) {
    // Skip very low confidence labels
    if (confidence < 0.4) continue;

    const match = matchFoodLabel(label);
    if (match) {
      return match;
    }
  }

  return null;
}

/**
 * Get top N matches for a label
 * @param label - Detected label
 * @param topN - Number of results to return
 * @returns Array of matching foods sorted by relevance
 */
export function getTopMatches(
  label: string,
  topN: number = 3,
): FoodLibraryItem[] {
  const normalized = label.toLowerCase().trim();

  const matches: { food: FoodLibraryItem; score: number }[] = [];

  for (const food of FOOD_LIBRARY) {
    const score = calculateSimilarity(normalized, food.name.toLowerCase());
    if (score > 0.2) {
      matches.push({ food, score });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, topN).map((m) => m.food);
}
