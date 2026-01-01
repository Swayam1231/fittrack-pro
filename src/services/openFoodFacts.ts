export type BarcodeFoodResult = {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
};

export const fetchFoodByBarcode = async (
  barcode: string
): Promise<BarcodeFoodResult | null> => {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const json = await res.json();

    if (!json.product || !json.product.nutriments) return null;

    const n = json.product.nutriments;

    return {
      name: json.product.product_name || "Scanned Food",
      caloriesPer100g: Math.round(n["energy-kcal_100g"] || 0),
      proteinPer100g: Math.round(n["proteins_100g"] || 0),
      carbsPer100g: Math.round(n["carbohydrates_100g"] || 0),
      fatsPer100g: Math.round(n["fat_100g"] || 0),
    };
  } catch {
    return null;
  }
};
