import { FOOD_LIBRARY } from "./foodLibraryData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebase/firebase";

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
  chapati: ["roti"],
  chawal: ["rice"],
  dahi: ["curd"],
  anda: ["egg"],
  aloo: ["potato"],
  chole: ["chola"],
  bhature: ["bhatura"],
};

/* ================= HELPERS ================= */

const normalize = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

const getAlternates = (token: string) => [
  token,
  ...(SEARCH_ALIASES[token] || []),
];

const fuzzyScore = (text: string, token: string) => {
  if (text.includes(token)) return 30;
  if (token.length < 4) return 0;

  let hits = 0;
  for (let i = 0; i < token.length - 2; i++) {
    if (text.includes(token.slice(i, i + 3))) hits++;
  }
  return hits >= 1 ? 15 : 0;
};

/* ================= RECENT SEARCHES ================= */

const RECENT_LIMIT = 8;

const getKey = () => {
  const uid = auth.currentUser?.uid || "guest";
  return `recent_searches_${uid}`;
};

export const saveRecentSearch = async (query: string) => {
  const q = normalize(query);
  if (!q) return;

  const raw = await AsyncStorage.getItem(getKey());
  const list: string[] = raw ? JSON.parse(raw) : [];

  const updated = [q, ...list.filter((i) => i !== q)].slice(0, RECENT_LIMIT);
  await AsyncStorage.setItem(getKey(), JSON.stringify(updated));
};

export const getRecentSearches = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(getKey());
  return raw ? JSON.parse(raw) : [];
};

export const clearRecentSearches = async () => {
  await AsyncStorage.removeItem(getKey());
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

  const qNorm = normalize(query);
  const words = qNorm.split(" ").filter(Boolean);

  return CACHE.map((food) => {
    let score = 0;

    if (food.searchText === qNorm) score += 100;
    else if (food.searchText.includes(qNorm)) score += 70;

    words.forEach((w) => {
      getAlternates(w).forEach((alt) => {
        if (food.searchText.includes(alt)) score += 25;
        else score += fuzzyScore(food.searchText, alt);
      });
    });

    return { food, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.food);
};
