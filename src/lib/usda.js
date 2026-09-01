function extractNutrients(food) {
  const out = { cal: 0, p: 0, c: 0, f: 0 };
  (food.foodNutrients || []).forEach((n) => {
    const num = String(n.nutrientNumber || n.nutrient?.number || "");
    const name = (n.nutrientName || n.nutrient?.name || "").toLowerCase();
    const value = Number(n.value ?? n.amount ?? 0);
    if (num === "208" || name.includes("energy")) out.cal = value;
    else if (num === "203" || name === "protein") out.p = value;
    else if (num === "205" || name.includes("carbohydrate")) out.c = value;
    else if (num === "204" || name.includes("total lipid")) out.f = value;
  });
  return out;
}

export async function searchUSDA(query) {
  const key = import.meta.env.VITE_USDA_API_KEY || "DEMO_KEY";
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(query)}&pageSize=20&dataType=${encodeURIComponent("Foundation,SR Legacy,Survey (FNDDS),Branded")}`;
  const res = await fetch(url);
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error("request_failed");
  const data = await res.json();
  return (data.foods || []).map((food) => ({
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandOwner || food.brandName || null,
    servingSize: food.servingSize || null,
    servingSizeUnit: food.servingSizeUnit || null,
    per100: extractNutrients(food),
  }));
}
