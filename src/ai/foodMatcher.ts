import { FoodLibraryItem } from "../data/foodLibrary";
import { FOOD_LIBRARY } from "../data/foodLibraryData";

export function matchFoodLabel(label: string): FoodLibraryItem | null {
  const normalized = label.toLowerCase();

  // 1. Exact contains match
  for (const food of FOOD_LIBRARY) {
    const name = food.name.toLowerCase();

    if (name.includes(normalized) || normalized.includes(name)) {
      return food;
    }
  }

  // 2. Word-by-word fuzzy match
  const words = normalized.split(" ");

  for (const food of FOOD_LIBRARY) {
    const foodName = food.name.toLowerCase();

    for (const w of words) {
      if (w.length >= 3 && foodName.includes(w)) {
        return food;
      }
    }
  }

  return null;
}
