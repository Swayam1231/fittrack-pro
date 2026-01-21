import { useState, useCallback } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/* ===================== TYPES ===================== */

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  target: string;
  equipment: string;
  bodyPart?: string;
  met?: number;
};

type Filters = {
  search?: string;
  muscle?: string | null;
  equipment?: string | null;
};

/* ===================== HOOK ===================== */

export function useExerciseCatalog() {
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot | null>(null);

  const PAGE_SIZE = 40;

  const buildQuery = (filters: Filters) => {
    const base = collection(db, "exercises");

    // 🔍 Name search (prefix search)
    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim();
      return query(
        base,
        orderBy("name"),
        where("name", ">=", s),
        where("name", "<=", s + "\uf8ff"),
        limit(PAGE_SIZE)
      );
    }

    // 🎯 Muscle filter
    if (filters.muscle) {
      return query(
        base,
        where("target", "==", filters.muscle),
        orderBy("name"),
        limit(PAGE_SIZE)
      );
    }

    // 🏋️ Equipment filter
    if (filters.equipment) {
      return query(
        base,
        where("equipment", "==", filters.equipment),
        orderBy("name"),
        limit(PAGE_SIZE)
      );
    }

    // 📄 Default
    return query(base, orderBy("name"), limit(PAGE_SIZE));
  };

  const load = useCallback(
    async (filters: Filters = {}, reset = false) => {
      if (loading) return;
      if (!hasMore && !reset) return;

      setLoading(true);

      try {
        let q = buildQuery(filters);

        if (!reset && lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snap = await getDocs(q);

        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setExercises((prev) =>
          reset ? items : [...prev, ...items]
        );

        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [loading, lastDoc, hasMore]
  );

  const search = useCallback(
    async (filters: Filters = {}) => {
      setLastDoc(null);
      setHasMore(true);
      setExercises([]);
      await load(filters, true);
    },
    [load]
  );

  return {
    exercises,
    loading,
    hasMore,
    loadMore: load,
    search,
  };
}
