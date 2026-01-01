import { auth, db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";

/* ================= TYPES ================= */

export type FoodSource = "base" | "barcode" | "custom";

export type FoodLibraryItem = {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  source?: FoodSource;
};

/* ================= IN-MEMORY STORE ================= */

let foodLibrary: FoodLibraryItem[] = [];
let hasLoaded = false;

/* ================= LOAD FOOD LIBRARY ================= */

export const loadFoodLibrary = async () => {
  if (hasLoaded) return;
  hasLoaded = true;

  /* 1️⃣ BASE FOODS */
  foodLibrary = [
    {
      id: "rice_white",
      name: "White Rice (Cooked)",
      caloriesPer100g: 130,
      proteinPer100g: 2.7,
      carbsPer100g: 28,
      fatsPer100g: 0.3,
      source: "base",
    },
    {
      id: "roti",
      name: "Roti",
      caloriesPer100g: 260,
      proteinPer100g: 9,
      carbsPer100g: 55,
      fatsPer100g: 3,
      source: "base",
    },
  ];

  /* 2️⃣ LOAD USER FOOD LIBRARY FROM FIRESTORE */
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const snap = await getDocs(
    collection(db, "users", uid, "foodLibrary")
  );

  snap.forEach((d) => {
    const data = d.data() as FoodLibraryItem;

    const exists = foodLibrary.some(
      (f) => f.name.toLowerCase() === data.name.toLowerCase()
    );

    if (!exists) {
      foodLibrary.push(data);
    }
  });
};

/* ================= SEARCH ================= */

export const searchFoods = (query: string): FoodLibraryItem[] => {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return foodLibrary.filter((f) =>
    f.name.toLowerCase().includes(q)
  );
};

/* ================= MERGE + PERSIST ================= */

export const addFoodToLibraryIfMissing = async (
  food: FoodLibraryItem
) => {
  const exists = foodLibrary.some(
    (f) => f.name.toLowerCase() === food.name.toLowerCase()
  );

  if (exists) return;

  foodLibrary.push(food);

  /* 🔴 PERSIST TO FIRESTORE */
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await setDoc(
    doc(db, "users", uid, "foodLibrary", food.id),
    {
      ...food,
      createdAt: Date.now(),
    }
  );
};

/* ================= ACCESS ================= */

export const getFoodLibrary = () => foodLibrary;
