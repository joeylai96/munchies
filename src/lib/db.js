import { supabase } from "../supabaseClient";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function upsertProfile(userId, fields) {
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTodayEntries(userId) {
  const { data, error } = await supabase
    .from("food_entries")
    .select("*")
    .eq("profile_id", userId)
    .eq("log_date", todayKey())
    .order("logged_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addFoodEntry(userId, entry) {
  const { data, error } = await supabase
    .from("food_entries")
    .insert({
      profile_id: userId,
      name: entry.name,
      calories: entry.cal,
      protein_g: entry.p,
      carbs_g: entry.c,
      fat_g: entry.f,
      log_date: todayKey(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFoodEntry(entryId) {
  const { error } = await supabase.from("food_entries").delete().eq("id", entryId);
  if (error) throw error;
}

export async function getDaysLoggedCount(userId) {
  const { count, error } = await supabase
    .from("food_entries")
    .select("log_date", { count: "exact", head: true })
    .eq("profile_id", userId);
  if (error) throw error;
  return count || 0;
}

export async function getWeightHistory(userId) {
  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("profile_id", userId)
    .order("log_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function logWeight(userId, weightKg) {
  const { data, error } = await supabase
    .from("weight_entries")
    .upsert({ profile_id: userId, weight_kg: weightKg, log_date: todayKey() }, { onConflict: "profile_id,log_date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getWater(userId) {
  const { data, error } = await supabase
    .from("water_logs")
    .select("*")
    .eq("profile_id", userId)
    .eq("log_date", todayKey())
    .maybeSingle();
  if (error) throw error;
  return data?.cups || 0;
}

export async function setWater(userId, cups) {
  const { error } = await supabase
    .from("water_logs")
    .upsert({ profile_id: userId, log_date: todayKey(), cups: Math.max(0, cups) }, { onConflict: "profile_id,log_date" });
  if (error) throw error;
}
