import { FOOD_LIBRARY } from "./foodLibraryData";

/* ================= TYPES ================= */

export type FoodLibraryItem = {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;

  searchText: string;
};

/* ================= SEARCH ALIASES ================= */

const SEARCH_ALIASES: Record<string, string[]> = {
  chapati: ["roti", "chapathi"],
  roti: ["chapati"],
  chawal: ["rice"],
  rice: ["chawal"],
  dahi: ["curd", "yogurt"],
  curd: ["dahi"],
  anda: ["egg"],
  egg: ["anda"],
  chicken: ["murga"],
  aloo: ["potato"],
  potato: ["aloo"],
  bhindi: ["okra"],
  palak: ["spinach"],
  gobhi: ["cauliflower"],
  chole: ["chola"],
  bhature: ["bhatura"],
};

/* ================= HELPERS ================= */

const normalize = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

const getAlternates = (token: string): string[] => {
  return [token, ...(SEARCH_ALIASES[token] || [])];
};

const fuzzyIncludes = (text: string, token: string) => {
  if (text.includes(token)) return true;
  if (token.length < 4) return false;

  // simple typo tolerance
  let hits = 0;
  for (let i = 0; i < token.length - 2; i++) {
    const chunk = token.slice(i, i + 3);
    if (text.includes(chunk)) hits++;
  }
  return hits >= 1;
};

/* ================= CACHE ================= */

let CACHE: FoodLibraryItem[] = [];
let LOADED = false;

/* ================= LOAD ================= */

export const loadFoodLibrary = () => {
  if (LOADED) return;

  CACHE = FOOD_LIBRARY.map((f) => ({
    ...f,
    searchText: normalize(f.name),
  }));

  LOADED = true;
};

/* ================= SEARCH ================= */

export const searchFoods = (query: string): FoodLibraryItem[] => {
  if (!LOADED) loadFoodLibrary();
  if (!query.trim()) return CACHE;

  const words = normalize(query).split(" ").filter(Boolean);

  return CACHE.filter((food) => {
    // ✅ EVERY USER WORD MUST MATCH
    return words.every((word) => {
      const options = getAlternates(word);

      return options.some((opt) =>
        fuzzyIncludes(food.searchText, opt)
      );
    });
  });
};
