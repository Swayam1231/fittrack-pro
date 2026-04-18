import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, Timestamp } from "firebase/firestore";
import { subDays, startOfDay } from "date-fns";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

type Range = 7 | 30 | 90;

interface Meal {
  calories: number;
  createdAt: Timestamp;
}

interface Workout {
  caloriesBurned: number;
  createdAt: Timestamp;
}

interface UserData {
  weight?: number;
  goalStartWeight?: number;
  targets?: {
    calories: number;
  };
}

export function useProgressMetrics(range: Range) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    if (!uid) return;

    const unsubUser = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) setUserData(snap.data() as UserData);
    });

    const unsubMeals = onSnapshot(
      collection(db, "users", uid, "meals"),
      (snap) => setMeals(snap.docs.map(d => d.data() as Meal))
    );

    const unsubWorkouts = onSnapshot(
      collection(db, "users", uid, "workouts"),
      (snap) => setWorkouts(snap.docs.map(d => d.data() as Workout))
    );

    return () => {
      unsubUser();
      unsubMeals();
      unsubWorkouts();
    };
  }, [uid]);

  const startDate = useMemo(() => {
    return startOfDay(subDays(new Date(), range - 1));
  }, [range]);

  const weightChange = useMemo(() => {
    if (!userData?.goalStartWeight || !userData?.weight) return 0;
    return userData.weight - userData.goalStartWeight;
  }, [userData]);

  const workoutConsistency = useMemo(() => {
    if (!workouts.length) return 0;

    const daysWithWorkout = new Set<string>();

    workouts.forEach(w => {
      if (!w.createdAt) return;
      const d = startOfDay(w.createdAt.toDate());
      if (d < startDate) return;
      daysWithWorkout.add(d.toISOString());
    });

    return Math.round((daysWithWorkout.size / range) * 100);
  }, [workouts, startDate, range]);

  const calorieAdherence = useMemo(() => {
    if (!meals.length || !userData?.targets?.calories) return 0;

    const dailyCalories = new Map<string, number>();

    meals.forEach(m => {
      if (!m.createdAt) return;
      const d = startOfDay(m.createdAt.toDate());
      if (d < startDate) return;

      const key = d.toISOString();
      dailyCalories.set(key, (dailyCalories.get(key) || 0) + (m.calories || 0));
    });

    let compliantDays = 0;
    dailyCalories.forEach(total => {
      if (total <= userData.targets!.calories) compliantDays++;
    });

    return Math.round((compliantDays / range) * 100);
  }, [meals, userData, startDate, range]);

  return {
    weightChange,
    workoutConsistency,
    calorieAdherence,
    loading: !userData,
  };
}
