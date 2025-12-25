import React, { useEffect, useMemo, useState } from "react";
import { loadExercisesByBodyPart } from "../utils/exerciseLoader";

type Exercise = {
  id: string;
  name: string;
  target: string;
  equipment: string;
  difficulty: string;
  category: string;
};

const BODY_PARTS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "waist",
  "full body"
];

export default function ExerciseBrowser() {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  // Search + filters
  const [search, setSearch] = useState("");
  const [equipment, setEquipment] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");

  /* ---------------- LOAD BODY PART ---------------- */

  const handleSelect = async (bodyPart: string) => {
    setSelectedBodyPart(bodyPart);
    setLoading(true);

    try {
      const data = await loadExercisesByBodyPart(bodyPart);
      setAllExercises(data);
    } catch (e) {
      console.error(e);
      setAllExercises([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER LOGIC ---------------- */

  const filteredExercises = useMemo(() => {
    const query = search.toLowerCase();

    return allExercises.filter(ex => {
      if (
        query &&
        !(
          ex.name.toLowerCase().includes(query) ||
          ex.target.toLowerCase().includes(query) ||
          ex.equipment.toLowerCase().includes(query)
        )
      ) {
        return false;
      }

      if (equipment !== "all" && ex.equipment !== equipment) return false;
      if (difficulty !== "all" && ex.difficulty !== difficulty) return false;
      if (category !== "all" && ex.category !== category) return false;

      return true;
    });
  }, [allExercises, search, equipment, difficulty, category]);

  /* ---------------- UNIQUE FILTER VALUES ---------------- */

  const equipments = useMemo(
    () => ["all", ...new Set(allExercises.map(e => e.equipment))],
    [allExercises]
  );

  const difficulties = useMemo(
    () => ["all", ...new Set(allExercises.map(e => e.difficulty))],
    [allExercises]
  );

  const categories = useMemo(
    () => ["all", ...new Set(allExercises.map(e => e.category))],
    [allExercises]
  );

  /* ---------------- UI ---------------- */

  return (
    <div style={{ padding: 16 }}>
      <h2>Exercise Browser</h2>

      {/* BODY PART SELECT */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {BODY_PARTS.map(bp => (
          <button
            key={bp}
            onClick={() => handleSelect(bp)}
            style={{
              padding: "6px 10px",
              background: selectedBodyPart === bp ? "#333" : "#ddd",
              color: selectedBodyPart === bp ? "#fff" : "#000",
              cursor: "pointer"
            }}
          >
            {bp.toUpperCase()}
          </button>
        ))}
      </div>

      <hr />

      {/* SEARCH + FILTERS */}
      {selectedBodyPart && (
        <>
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: 8, width: "100%", marginBottom: 10 }}
          />

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <select value={equipment} onChange={e => setEquipment(e.target.value)}>
              {equipments.map(e => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>

            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              {difficulties.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* RESULTS */}
      {loading && <p>Loading exercises…</p>}

      {!loading && filteredExercises.length > 0 && (
        <>
          <p>
            Showing {filteredExercises.length} of {allExercises.length}
          </p>

          <ul>
            {filteredExercises.map(ex => (
              <li key={ex.id} style={{ marginBottom: 6 }}>
                <strong>{ex.name}</strong>
                <br />
                <small>
                  {ex.target} | {ex.equipment} | {ex.difficulty} | {ex.category}
                </small>
              </li>
            ))}
          </ul>
        </>
      )}

      {!loading && selectedBodyPart && filteredExercises.length === 0 && (
        <p>No exercises found.</p>
      )}
    </div>
  );
}
