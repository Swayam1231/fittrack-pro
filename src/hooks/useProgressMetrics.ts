import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

/* ---------- PURE JS DATE HELPERS (NO DEPENDENCIES) ---------- */
function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

type Range = 7 | 30 | 90;

export function useProgressMetrics(range: Range) {
  const uid = auth.currentUser?.uid;

  const [user, setUser] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);

  /* ---------- REAL-TIME FIRESTORE SUBSCRIPTIONS ---------- */
  useEffect(() => {
  if (!uid) return;

  const unsubUser = onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) setUser(snap.data());
  });

  const unsubMeals = onSnapshot(
    collection(db, "users", uid, "meals"),
    (snap) => setMeals(snap.docs.map(d => d.data()))
  );

  const unsubWorkouts = onSnapshot(
    collection(db, "users", uid, "workouts"),
    (snap) => setWorkouts(snap.docs.map(d => d.data()))
  );

  return () => {
    unsubUser();
    unsubMeals();
    unsubWorkouts();
  };
}, [uid]);


  /* ---------- DATE WINDOW ---------- */
  const startDate = useMemo(() => {
    return startOfDay(subDays(new Date(), range - 1));
  }, [range]);

  /* ---------- WEIGHT CHANGE ---------- */
  const weightChange = useMemo(() => {
    if (!user?.goalStartWeight || !user?.weight) return 0;
    return user.weight - user.goalStartWeight;
  }, [user]);

  /* ---------- WORKOUT CONSISTENCY ---------- */
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

  /* ---------- CALORIE ADHERENCE ---------- */
  const calorieAdherence = useMemo(() => {
    if (!meals.length || !user?.targets?.calories) return 0;

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
      if (total <= user.targets.calories) compliantDays++;
    });

    return Math.round((compliantDays / range) * 100);
  }, [meals, user, startDate, range]);

  return {
    weightChange,
    workoutConsistency,
    calorieAdherence,
    loading: !user,
  };
}
