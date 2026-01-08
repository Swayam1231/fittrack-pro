import { FOOD_LIBRARY } from "../data/foodLibraryData";
import { FoodLibraryItem } from "../data/foodLibrary";

export function matchFoodLabel(label: string): FoodLibraryItem | null {
  const normalized = label.toLowerCase();

  // 1. Direct contains match
  for (const food of FOOD_LIBRARY) {
    const name = food.name.toLowerCase();
    if (name.includes(normalized) || normalized.includes(name)) {
      return food;
    }
  }

  // 2. Word-based fuzzy match
  const words = normalized.split(" ");
  for (const food of FOOD_LIBRARY) {
    const name = food.name.toLowerCase();
    for (const w of words) {
      if (w.length >= 3 && name.includes(w)) {
        return food;
      }
    }
  }

  return null;
}
