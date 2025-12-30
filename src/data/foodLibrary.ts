import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";

/* ================= TYPES ================= */

export type FoodLibraryItem = {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  category: string;
  vegetarian: boolean;
  keywords: string[];
  searchText: string;
  source: "library" | "custom";
};

/* ================= CACHE ================= */

let foodCache: FoodLibraryItem[] = [];
let loaded = false;

/* ================= LOADERS ================= */

export const loadFoodLibrary = async (): Promise<void> => {
  if (loaded) return;

  const foods: FoodLibraryItem[] = [];

  // 🔹 Global food library
  const libSnap = await getDocs(collection(db, "foodLibrary"));
  libSnap.forEach((doc) => {
    const d = doc.data();
    foods.push({
      id: doc.id,
      name: d.name,
      caloriesPer100g: d.caloriesPer100g,
      proteinPer100g: d.proteinPer100g,
      carbsPer100g: d.carbsPer100g,
      fatsPer100g: d.fatsPer100g,
      category: d.category,
      vegetarian: d.vegetarian,
      keywords: d.keywords || [],
      searchText: (
        d.name + " " + (d.keywords || []).join(" ")
      ).toLowerCase(),
      source: "library",
    });
  });

  // 🔹 User custom foods
  const uid = auth.currentUser?.uid;
  if (uid) {
    const customSnap = await getDocs(
      collection(db, "users", uid, "customFoods")
    );

    customSnap.forEach((doc) => {
      const d = doc.data();
      foods.push({
        id: doc.id,
        name: d.name,
        caloriesPer100g: d.caloriesPer100g,
        proteinPer100g: d.proteinPer100g,
        carbsPer100g: d.carbsPer100g,
        fatsPer100g: d.fatsPer100g,
        category: "Custom",
        vegetarian: true,
        keywords: [],
        searchText: d.name.toLowerCase(),
        source: "custom",
      });
    });
  }

  foodCache = foods;
  loaded = true;
};

/* ================= SEARCH ================= */

export const searchFoods = (query: string): FoodLibraryItem[] => {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase();

  return foodCache
    .filter((f) => f.searchText.includes(q))
    .slice(0, 20);
};
