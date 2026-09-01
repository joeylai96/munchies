export async function analyzeFood({ imageBase64, mediaType, description }) {
  const res = await fetch("/api/analyze-food", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mediaType, description }),
  });
  if (!res.ok) throw new Error("Analysis request failed");
  const parsed = await res.json();
  return {
    name: parsed.name || "Logged food",
    cal: Math.round(parsed.calories || 0),
    p: Math.round((parsed.protein_g || 0) * 10) / 10,
    c: Math.round((parsed.carbs_g || 0) * 10) / 10,
    f: Math.round((parsed.fat_g || 0) * 10) / 10,
    confidence: parsed.confidence || "medium",
    note: parsed.note || "",
  };
}
