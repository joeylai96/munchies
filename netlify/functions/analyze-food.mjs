export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server missing GEMINI_API_KEY" }), { status: 500 });
  }

  const { imageBase64, mediaType, description } = await req.json();

  const instructions =
    "You are a nutrition estimation engine embedded in a calorie tracking app called Munchies. " +
    "Given a food photo and/or text description, identify the food(s) and estimate nutrition for the " +
    "portion shown or described. Respond with ONLY a single JSON object, no prose, no markdown fences, " +
    'in exactly this shape: {"name": string, "calories": number, "protein_g": number, "carbs_g": number, ' +
    '"fat_g": number, "confidence": "low"|"medium"|"high", "note": string}. ' +
    "The name should be a short, natural label for the meal. The note should be one short sentence " +
    "about portion assumptions. Numbers must be plain numbers, not strings.";

  const parts = [];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: mediaType || "image/jpeg", data: imageBase64 } });
  }
  parts.push({
    text: description
      ? `Description from the user: "${description}". ${imageBase64 ? "Also use the attached photo." : ""}`
      : "Analyze the attached photo of food.",
  });

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: instructions }] },
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: "Gemini request failed", detail: errText }), { status: 502 });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No text response from Gemini");
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const config = { path: "/api/analyze-food" };
