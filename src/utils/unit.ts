export type UnitSystem = "metric" | "imperial";

/* -------- WEIGHT -------- */
export const kgToLb = (kg: number) => Math.round(kg * 2.20462);
export const lbToKg = (lb: number) => lb / 2.20462;

/* -------- HEIGHT -------- */
export const cmToFtIn = (cm: number) => {
  const inches = cm / 2.54;
  const ft = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return `${ft}'${inch}"`;
};

export const ftInToCm = (ft: number, inch: number) =>
  (ft * 12 + inch) * 2.54;

/* -------- DISPLAY HELPERS -------- */
export const formatWeight = (kg: number, unit: UnitSystem) =>
  unit === "imperial" ? `${kgToLb(kg)} lbs` : `${kg} kg`;

export const formatHeight = (cm: number, unit: UnitSystem) =>
  unit === "imperial" ? cmToFtIn(cm) : `${cm} cm`;
