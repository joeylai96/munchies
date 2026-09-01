export const ACTIVITY_OPTIONS = [
  { id: "sedentary", mult: 1.2, label: "Sedentary", desc: "Little or no exercise" },
  { id: "light", mult: 1.375, label: "Lightly active", desc: "Light exercise 1–3 days/wk" },
  { id: "moderate", mult: 1.55, label: "Moderately active", desc: "Moderate exercise 3–5 days/wk" },
  { id: "active", mult: 1.725, label: "Active", desc: "Hard exercise 6–7 days/wk" },
  { id: "veryActive", mult: 1.9, label: "Very active", desc: "Physical job or 2x/day training" },
];

export const GOAL_OPTIONS = [
  { id: "lose", label: "Lose weight" },
  { id: "maintain", label: "Maintain" },
  { id: "gain", label: "Gain weight" },
  { id: "muscle", label: "Build muscle" },
];

export const PACE_OPTIONS = [
  { id: "mild", label: "Mild", kcal: 250 },
  { id: "moderate", label: "Moderate", kcal: 500 },
  { id: "aggressive", label: "Aggressive", kcal: 750 },
];

export function computeGoals({ sex, age, height_cm, weight_kg, body_fat_pct, activity, goal, pace }) {
  const a = Number(age) || 30;
  const h = Number(height_cm) || 170;
  const w = Number(weight_kg) || 70;
  let bmr;
  if (body_fat_pct) {
    const leanMass = w * (1 - Number(body_fat_pct) / 100);
    bmr = 370 + 21.6 * leanMass; // Katch-McArdle
  } else {
    bmr = sex === "female" ? 10 * w + 6.25 * h - 5 * a - 161 : 10 * w + 6.25 * h - 5 * a + 5; // Mifflin-St Jeor
  }
  const activityMult = (ACTIVITY_OPTIONS.find((o) => o.id === activity) || ACTIVITY_OPTIONS[1]).mult;
  const tdee = bmr * activityMult;

  const paceKcal = (PACE_OPTIONS.find((p) => p.id === pace) || PACE_OPTIONS[1]).kcal;
  let calGoal = tdee;
  if (goal === "lose") calGoal = tdee - paceKcal;
  else if (goal === "gain") calGoal = tdee + paceKcal;
  else if (goal === "muscle") calGoal = tdee + Math.min(paceKcal, 350);
  calGoal = Math.max(1200, Math.round(calGoal));

  const proteinPerKg = goal === "lose" ? 2.0 : goal === "muscle" ? 1.9 : 1.6;
  const proteinGoal = Math.round(w * proteinPerKg);
  const fatGoal = Math.round((calGoal * 0.28) / 9);
  const carbsGoal = Math.max(50, Math.round((calGoal - proteinGoal * 4 - fatGoal * 9) / 4));

  return { cal_goal: calGoal, protein_goal: proteinGoal, carbs_goal: carbsGoal, fat_goal: fatGoal };
}

export function kgToLb(kg) {
  return kg * 2.20462;
}
export function lbToKg(lb) {
  return lb / 2.20462;
}
export function cmToFtIn(cm) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn % 12);
  return { ft, inch };
}
export function ftInToCm(ft, inch) {
  return (Number(ft) * 12 + Number(inch)) * 2.54;
}
export function round(n, d = 0) {
  const m = 10 ** d;
  return Math.round((Number(n) || 0) * m) / m;
}
