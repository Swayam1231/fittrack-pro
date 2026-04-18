import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  Timestamp, 
  addDoc, 
  deleteDoc,
  updateDoc,
  getDoc,
  orderBy,
  runTransaction,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { startOfDay, endOfDay, format, subDays } from "date-fns";

/* ---------- TYPES ---------- */

export interface Meal {
  id?: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  grams: number;
  mealType: string;
  createdAt: Timestamp;
}

export interface Workout {
  id?: string;
  name: string;
  exercises: any[];
  duration: number;
  caloriesBurned: number;
  createdAt: Timestamp;
}

export interface UserTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  weight?: number;
  goalWeight?: number;
  goalStartWeight?: number;
  streak?: number;
  lastActiveDate?: string; // YYYY-MM-DD
  targets: UserTargets;
}

export interface WeightEntry {
  id?: string;
  weight: number;
  date: Timestamp;
}

/* ---------- SERVICE ---------- */

export const FirestoreService = {
  // --- User Profile ---
  subscribeToProfile: (uid: string, callback: (data: UserProfile | null) => void) => {
    return onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        callback({ uid, ...snap.data() } as UserProfile);
      } else {
        callback(null);
      }
    });
  },

  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    await updateDoc(doc(db, "users", uid), data);
  },

  updateStreak: async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const todayStr = format(new Date(), "yyyy-MM-dd");

    try {
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;

        const data = userSnap.data();
        const lastActive = data.lastActiveDate;
        const currentStreak = data.streak || 0;

        if (lastActive === todayStr) return; // Already updated today

        const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
        
        let newStreak = 1;
        if (lastActive === yesterdayStr) {
          newStreak = currentStreak + 1;
        }

        transaction.update(userRef, {
          streak: newStreak,
          lastActiveDate: todayStr
        });
      });
    } catch (e) {
      console.error("Streak update failed", e);
    }
  },

  // --- Weight History ---
  subscribeToWeightHistory: (uid: string, callback: (entries: WeightEntry[]) => void) => {
    const q = query(
      collection(db, "users", uid, "weightEntries"),
      orderBy("date", "asc")
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry)));
    });
  },

  logWeight: async (uid: string, weight: number) => {
    // Also update current weight on profile
    await updateDoc(doc(db, "users", uid), { weight });
    return await addDoc(collection(db, "users", uid, "weightEntries"), {
      weight,
      date: Timestamp.now()
    });
  },

  // --- Favorite Meals (Templates) ---
  subscribeToFavoriteMeals: (uid: string, callback: (meals: any[]) => void) => {
    return onSnapshot(collection(db, "users", uid, "favoriteMeals"), (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  addFavoriteMeal: async (uid: string, meal: any) => {
    return await addDoc(collection(db, "users", uid, "favoriteMeals"), meal);
  },

  deleteFavoriteMeal: async (uid: string, id: string) => {
    await deleteDoc(doc(db, "users", uid, "favoriteMeals", id));
  },

  // --- Meals ---
  subscribeToTodayMeals: (uid: string, callback: (meals: Meal[]) => void) => {
    const today = startOfDay(new Date());
    const q = query(
      collection(db, "users", uid, "meals"),
      where("createdAt", ">=", Timestamp.fromDate(today))
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Meal)));
    });
  },

  subscribeToMealsByDate: (uid: string, date: Date, callback: (meals: Meal[]) => void) => {
    const start = startOfDay(date);
    const end = endOfDay(date);
    const q = query(
      collection(db, "users", uid, "meals"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end))
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Meal)));
    });
  },

  addMeal: async (uid: string, meal: Omit<Meal, "id">) => {
    const res = await addDoc(collection(db, "users", uid, "meals"), meal);
    await FirestoreService.updateStreak(uid);
    return res;
  },

  deleteMeal: async (uid: string, mealId: string) => {
    await deleteDoc(doc(db, "users", uid, "meals", mealId));
  },

  // --- Workouts ---
  subscribeToTodayWorkouts: (uid: string, callback: (workouts: Workout[]) => void) => {
    const today = startOfDay(new Date());
    const q = query(
      collection(db, "users", uid, "workouts"),
      where("createdAt", ">=", Timestamp.fromDate(today))
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Workout)));
    });
  },

  subscribeToWorkoutHistory: (uid: string, callback: (workouts: Workout[]) => void) => {
    return onSnapshot(collection(db, "users", uid, "workouts"), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Workout));
      all.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      callback(all);
    });
  },

  addWorkout: async (uid: string, workout: Omit<Workout, "id">) => {
    const res = await addDoc(collection(db, "users", uid, "workouts"), workout);
    await FirestoreService.updateStreak(uid);
    return res;
  },

  deleteWorkout: async (uid: string, workoutId: string) => {
    await deleteDoc(doc(db, "users", uid, "workouts", workoutId));
  }
  // --- Custom Foods ---
  addCustomFood: async (uid: string, food: any) => {
    return await addDoc(collection(db, "users", uid, "customFoods"), food);
  },

  subscribeToCustomFoods: (uid: string, callback: (foods: any[]) => void) => {
    return onSnapshot(collection(db, "users", uid, "customFoods"), (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  // --- Favorites ---
  subscribeToFavoriteFoods: (uid: string, callback: (foods: any[]) => void) => {
    const q = query(
      collection(db, "users", uid, "foodStats"),
      where("favorite", "==", true)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  unfavoriteFood: async (uid: string, id: string) => {
    await updateDoc(doc(db, "users", uid, "foodStats", id), { favorite: false });
  },

  // --- Water ---
  subscribeToTodayWater: (uid: string, callback: (liters: number) => void) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, "users", uid, "water", today);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data().liters || 0);
      } else {
        callback(0);
      }
    });
  },

  logWater: async (uid: string, amount: number) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, "users", uid, "water", today);
    const snap = await getDoc(docRef);
    const current = snap.exists() ? snap.data().liters || 0 : 0;
    const newAmount = Math.max(0, current + amount);
    
    // Also trigger streak update if first activity of day
    if (current === 0 && amount > 0) {
      await FirestoreService.updateStreak(uid);
    }

    await setDoc(docRef, { liters: newAmount }, { merge: true });
  },

  // --- Steps ---
  subscribeToTodaySteps: (uid: string, callback: (steps: number) => void) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, "users", uid, "steps", today);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data().count || 0);
      } else {
        callback(0);
      }
    });
  },

  updateSteps: async (uid: string, count: number) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, "users", uid, "steps", today);
    await setDoc(docRef, { count, updatedAt: Timestamp.now() }, { merge: true });
  }
};
