import { createClient } from "@supabase/supabase-js";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return new Response(JSON.stringify({ error: "Missing auth token" }), { status: 401 });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server missing Supabase service credentials" }), { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Verify the token actually belongs to a real logged-in user before deleting anything.
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }

  // Deleting the auth user cascades to profiles/food_entries/weight_entries/water_logs
  // via the ON DELETE CASCADE foreign keys defined in supabase/schema.sql.
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
};

export const config = { path: "/api/delete-account" };
