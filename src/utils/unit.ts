/* =====================================================
   METRIC-ONLY UNIT UTILITIES
   ===================================================== */

/**
 * Height is assumed to be stored in centimeters (cm)
 * Weight is assumed to be stored in kilograms (kg)
 *
 * Imperial support has been intentionally removed.
 */

/* ---------- TYPES ---------- */
export type UnitSystem = "metric";

/* ---------- HEIGHT ---------- */

/**
 * Format height for display (cm)
 * @example 170 -> "170 cm"
 */
export function formatHeight(heightCm: number, _unit: UnitSystem = "metric") {
  if (!heightCm && heightCm !== 0) return "—";
  return `${Math.round(heightCm)} cm`;
}

/* ---------- WEIGHT ---------- */

/**
 * Format weight for display (kg)
 * @example 70.5 -> "70.5 kg"
 */
export function formatWeight(weightKg: number, _unit: UnitSystem = "metric") {
  if (!weightKg && weightKg !== 0) return "—";
  return `${Number(weightKg.toFixed(1))} kg`;
}

/* ---------- CALCULATIONS ---------- */

/**
 * Calculate BMI using metric units
 * BMI = kg / (m²)
 */
export function calculateBMI(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Calculate Lean Body Mass (kg)
 */
export function calculateLeanMass(weightKg: number, bodyFatPercent?: number) {
  if (!weightKg) return null;
  if (!bodyFatPercent && bodyFatPercent !== 0) return weightKg;
  return Number(
    (weightKg * (1 - bodyFatPercent / 100)).toFixed(2)
  );
}

/**
 * Calculate Fat Mass (kg)
 */
export function calculateFatMass(weightKg: number, bodyFatPercent?: number) {
  if (!weightKg || bodyFatPercent == null) return null;
  return Number(
    (weightKg * (bodyFatPercent / 100)).toFixed(2)
  );
}
