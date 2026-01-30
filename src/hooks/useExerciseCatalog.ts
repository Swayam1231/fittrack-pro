import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useState } from "react";
import { db } from "../firebase/firebase";

/* ===================== TYPES ===================== */

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  target: string;
  equipment: string;
  bodyPart: string;
};

/* ===================== HOOK ===================== */

type Filters = {
  search?: string;
  bodyPart?: string | null;
  equipment?: string | null;
};

export function useExerciseCatalog() {
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const applyLocalFilters = (list: ExerciseCatalogItem[], filters: Filters) => {
    let out = list;

    // Equipment filter locally
    if (filters.equipment) {
      out = out.filter((e) => e.equipment === filters.equipment);
    }

    // Sort locally by name (instead of Firestore orderBy)
    out = out.slice().sort((a, b) => a.name.localeCompare(b.name));

    return out;
  };

  const search = useCallback(async (filters: Filters = {}) => {
    setLoading(true);

    try {
      const base = collection(db, "exercises");
      let q;

      // 🔍 Search by name (prefix)
      if (filters.search && filters.search.trim()) {
        const s = filters.search.trim();
        q = query(
          base,
          where("name", ">=", s),
          where("name", "<=", s + "\uf8ff"),
        );
      }
      // 🧠 Filter by bodyPart
      else if (filters.bodyPart) {
        q = query(base, where("bodyPart", "==", filters.bodyPart));
      }
      // 📄 Default load (NO orderBy)
      else {
        q = query(base);
      }

      const snap = await getDocs(q);

      const items: ExerciseCatalogItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      const filtered = applyLocalFilters(items, filters);
      setExercises(filtered);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    exercises,
    loading,
    hasMore: false,
    loadMore: () => {},
    search,
  };
}
