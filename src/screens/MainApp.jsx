import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera, PenLine, Search, Plus, Minus, Home, TrendingUp, Settings as SettingsIcon,
  X, Loader2, Droplet, Trash2, Check, ChevronLeft, Flame, Beef, Wheat,
  Droplets as FatDrop, User, LogOut, AlertTriangle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, inputStyle, primaryBtnStyle, ghostBtnStyle } from "../lib/theme";
import { GOAL_OPTIONS, computeGoals, round, kgToLb, lbToKg } from "../lib/goals";
import { searchUSDA } from "../lib/usda";
import { analyzeFood } from "../lib/analyze";
import * as db from "../lib/db";

const QUICK_FOODS = [
  { name: "Large egg", cal: 74, p: 6, c: 0.4, f: 5 },
  { name: "Chicken breast (100g)", cal: 165, p: 31, c: 0, f: 3.6 },
  { name: "White rice, cooked (1 cup)", cal: 205, p: 4.3, c: 45, f: 0.4 },
  { name: "Avocado, medium", cal: 240, p: 3, c: 12, f: 22 },
  { name: "Banana, medium", cal: 105, p: 1.3, c: 27, f: 0.4 },
  { name: "Greek yogurt, plain (1 cup)", cal: 150, p: 20, c: 8, f: 4 },
  { name: "Peanut butter (1 tbsp)", cal: 94, p: 4, c: 3, f: 8 },
  { name: "Salmon fillet (100g)", cal: 208, p: 20, c: 0, f: 13 },
  { name: "Oats, dry (1/2 cup)", cal: 150, p: 5, c: 27, f: 3 },
  { name: "Broccoli, cooked (1 cup)", cal: 55, p: 3.7, c: 11, f: 0.6 },
];

function formatWeight(kg, unit) {
  if (kg == null) return null;
  return unit === "lb" ? round(kgToLb(kg), 1) : round(kg, 1);
}
function toKg(value, unit) {
  return unit === "lb" ? lbToKg(Number(value) || 0) : Number(value) || 0;
}
function useDebouncedValue(value, delayMs) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return d;
}

export default function MainApp({ profile, onProfileChange, onLogout, onAccountDeleted }) {
  const [tab, setTab] = useState("home");
  const [entries, setEntries] = useState([]);
  const [water, setWaterState] = useState(0);
  const [weightHistory, setWeightHistory] = useState([]);
  const [daysLoggedCount, setDaysLoggedCount] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const refresh = useCallback(async () => {
    const [e, w, wh, count] = await Promise.all([
      db.getTodayEntries(profile.id),
      db.getWater(profile.id),
      db.getWeightHistory(profile.id),
      db.getDaysLoggedCount(profile.id),
    ]);
    setEntries(e);
    setWaterState(w);
    setWeightHistory(wh);
    setDaysLoggedCount(count);
    setLoadingData(false);
  }, [profile.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addEntry(item) {
    await db.addFoodEntry(profile.id, item);
    await refresh();
    setAddOpen(false);
  }
  async function removeEntry(id) {
    await db.deleteFoodEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }
  async function changeWater(n) {
    const next = Math.max(0, n);
    setWaterState(next);
    await db.setWater(profile.id, next);
  }
  async function logWeight(kg) {
    await db.logWeight(profile.id, kg);
    const wh = await db.getWeightHistory(profile.id);
    setWeightHistory(wh);
  }

  const totals = entries.reduce(
    (acc, e) => ({ cal: acc.cal + Number(e.calories), p: acc.p + Number(e.protein_g), c: acc.c + Number(e.carbs_g), f: acc.f + Number(e.fat_g) }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );
  const remaining = Math.round(profile.cal_goal - totals.cal);

  return (
    <div style={{ width: "100%", maxWidth: 420, minHeight: "100%", position: "relative", paddingBottom: 84, margin: "0 auto" }}>
      <div style={{ padding: "28px 20px 8px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 30, color: COLORS.ink, letterSpacing: "-0.5px" }}>Munchies</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>
          {profile.avatar} Hey {profile.name} — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {tab === "home" && (
        <HomeView entries={entries} profile={profile} totals={totals} remaining={remaining} water={water} setWater={changeWater} removeEntry={removeEntry} loading={loadingData} />
      )}
      {tab === "progress" && (
        <ProgressView profile={profile} weightHistory={weightHistory} onLogWeight={logWeight} daysLoggedCount={daysLoggedCount} />
      )}
      {tab === "settings" && (
        <SettingsView profile={profile} onProfileChange={onProfileChange} onLogout={onLogout} onAccountDeleted={onAccountDeleted} />
      )}

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 72, background: COLORS.card, borderTop: `1px solid ${COLORS.cardLine}`, display: "flex", alignItems: "center", justifyContent: "space-around", borderRadius: "0 0 18px 18px" }}>
        <NavBtn active={tab === "home"} onClick={() => setTab("home")} icon={<Home size={22} />} label="Home" />
        <button onClick={() => setAddOpen(true)} style={{ width: 54, height: 54, borderRadius: "50%", background: COLORS.mango, border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(240,164,56,0.45)", marginTop: -24 }} aria-label="Add food">
          <Plus size={26} color="#fff" />
        </button>
        <NavBtn active={tab === "progress"} onClick={() => setTab("progress")} icon={<TrendingUp size={22} />} label="Progress" />
      </div>

      <button onClick={() => setTab("settings")} style={{ position: "absolute", top: 28, right: 20, background: "none", border: "none", color: tab === "settings" ? COLORS.mangoDeep : COLORS.inkSoft }} aria-label="Settings">
        <SettingsIcon size={22} />
      </button>

      {addOpen && <AddFoodModal onClose={() => setAddOpen(false)} onAdd={addEntry} />}
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", color: active ? COLORS.mangoDeep : COLORS.inkSoft }}>
      {icon}
      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11 }}>{label}</span>
    </button>
  );
}

function Ring({ pct, size = 148, stroke = 14, color, track }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

function MacroBar({ label, icon, value, goal, color }) {
  const pct = goal ? Math.min(1, value / goal) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        {icon}
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft }}>{label}</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: COLORS.cardLine, overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s ease" }} />
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, marginTop: 4, color: COLORS.ink }}>
        {round(value)}<span style={{ color: COLORS.inkSoft }}>/{goal}g</span>
      </div>
    </div>
  );
}

const circleBtnStyle = { width: 30, height: 30, borderRadius: "50%", border: `1px solid ${COLORS.cardLine}`, background: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center" };

function HomeView({ entries, profile, totals, remaining, water, setWater, removeEntry, loading }) {
  const pct = profile.cal_goal ? totals.cal / profile.cal_goal : 0;
  return (
    <div style={{ padding: "8px 20px 0" }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 20, padding: 20, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft }}>{remaining >= 0 ? "Remaining" : "Over budget"}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 40, color: COLORS.ink, lineHeight: 1.1 }}>{Math.abs(remaining)}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft }}>of {profile.cal_goal} kcal goal</div>
          </div>
          <div style={{ position: "relative", width: 148, height: 148 }}>
            <Ring pct={pct} color={pct > 1 ? COLORS.chili : COLORS.mango} track={COLORS.cardLine} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Flame size={18} color={COLORS.mangoDeep} />
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: COLORS.ink, marginTop: 2 }}>{round(totals.cal)}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: COLORS.inkSoft }}>eaten</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
          <MacroBar label="Protein" icon={<Beef size={13} color={COLORS.chili} />} value={totals.p} goal={profile.protein_goal} color={COLORS.chili} />
          <MacroBar label="Carbs" icon={<Wheat size={13} color={COLORS.mangoDeep} />} value={totals.c} goal={profile.carbs_goal} color={COLORS.mangoDeep} />
          <MacroBar label="Fat" icon={<FatDrop size={13} color={COLORS.sky} />} value={totals.f} goal={profile.fat_goal} color={COLORS.sky} />
        </div>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 20, padding: 16, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: COLORS.skySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Droplet size={18} color={COLORS.sky} />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: COLORS.ink }}>Water</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft }}>{water} / {profile.water_goal} cups</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setWater(water - 1)} style={circleBtnStyle}><Minus size={15} color={COLORS.ink} /></button>
          <button onClick={() => setWater(water + 1)} style={{ ...circleBtnStyle, background: COLORS.sky, borderColor: COLORS.sky }}><Plus size={15} color="#fff" /></button>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 10 }}>Today's log</div>
        {loading ? (
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: COLORS.inkSoft, textAlign: "center", padding: 20 }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: COLORS.inkSoft, background: COLORS.card, border: `1px dashed ${COLORS.cardLine}`, borderRadius: 16, padding: 22, textAlign: "center" }}>
            Nothing logged yet — tap the + to snap a photo, describe a meal, or quick-add.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((e) => (
              <div key={e.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{e.name}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>
                    {new Date(e.logged_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · P{round(e.protein_g)} C{round(e.carbs_g)} F{round(e.fat_g)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{round(e.calories)}</div>
                  <button onClick={() => removeEntry(e.id)} style={{ background: "none", border: "none", color: COLORS.inkSoft }}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressView({ profile, weightHistory, onLogWeight, daysLoggedCount }) {
  const [weightInput, setWeightInput] = useState("");
  const unit = profile.weight_unit || "kg";

  function submit() {
    const v = parseFloat(weightInput);
    if (!v || v <= 0) return;
    onLogWeight(toKg(v, unit));
    setWeightInput("");
  }

  const last = weightHistory.slice(-14);
  const values = last.map((e) => formatWeight(Number(e.weight_kg), unit));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = max - min || 1;
  const w = 340, h = 120, pad = 10;
  const points = last.map((e, i) => {
    const x = last.length > 1 ? pad + (i / (last.length - 1)) * (w - pad * 2) : w / 2;
    const val = formatWeight(Number(e.weight_kg), unit);
    const y = pad + (1 - (val - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  const currentWeight = weightHistory.length ? formatWeight(Number(weightHistory[weightHistory.length - 1].weight_kg), unit) : null;

  let goalPct = null;
  if (profile.weight_goal_kg && weightHistory.length) {
    const startKg = Number(weightHistory[0].weight_kg);
    const currentKg = Number(weightHistory[weightHistory.length - 1].weight_kg);
    const total = startKg - profile.weight_goal_kg;
    const done = startKg - currentKg;
    goalPct = total !== 0 ? Math.max(0, Math.min(1, done / total)) : 0;
  }

  return (
    <div style={{ padding: "8px 20px 0" }}>
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <div style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 18, padding: 16 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft }}>Last weight</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 24, color: COLORS.ink, marginTop: 4 }}>{currentWeight != null ? `${currentWeight} ${unit}` : "—"}</div>
        </div>
        <div style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 18, padding: 16 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft }}>Days logged</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 24, color: COLORS.ink, marginTop: 4 }}>{daysLoggedCount}</div>
        </div>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: COLORS.ink }}>Weight trend</div>
          {goalPct != null && <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.basil }}>{Math.round(goalPct * 100)}% of goal</div>}
        </div>
        {last.length >= 2 ? (
          <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <polyline points={points.join(" ")} fill="none" stroke={COLORS.basil} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {last.map((e, i) => {
              const [x, y] = points[i].split(",");
              return <circle key={e.id} cx={x} cy={y} r="3" fill={COLORS.basil} />;
            })}
          </svg>
        ) : (
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: COLORS.inkSoft, padding: "18px 0", textAlign: "center" }}>Log a couple of weigh-ins to see your trend.</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input type="number" step="0.1" placeholder={`Today's weight (${unit})`} value={weightInput} onChange={(e) => setWeightInput(e.target.value)} style={inputStyle} />
          <button onClick={submit} style={{ ...primaryBtnStyle, width: 90 }}>Log</button>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ profile, onProfileChange, onLogout, onAccountDeleted }) {
  const [local, setLocal] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const unit = profile.weight_unit || "kg";

  function update(field, value) {
    setLocal((l) => ({ ...l, [field]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const fields = {
      cal_goal: Number(local.cal_goal),
      protein_goal: Number(local.protein_goal),
      carbs_goal: Number(local.carbs_goal),
      fat_goal: Number(local.fat_goal),
      water_goal: Number(local.water_goal),
      weight_goal_kg: local.weight_goal_kg ? toKg(local.weight_goal_kg, unit) : null,
    };
    await onProfileChange(fields);
    setSaving(false);
    setSaved(true);
  }

  async function recalcAndUse(goals) {
    await onProfileChange(goals);
    setLocal((l) => ({ ...l, ...goals }));
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }
      await supabase.auth.signOut();
      onAccountDeleted();
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  const goalFields = [
    ["cal_goal", "Daily calorie goal", "kcal"],
    ["protein_goal", "Protein goal", "g"],
    ["carbs_goal", "Carb goal", "g"],
    ["fat_goal", "Fat goal", "g"],
    ["water_goal", "Water goal", "cups"],
  ];
  const label = { fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft };

  return (
    <div style={{ padding: "8px 20px 0" }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 18, padding: 18, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 34 }}>{profile.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.ink }}>{profile.name}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11.5, color: COLORS.inkSoft }}>
              {GOAL_OPTIONS.find((g) => g.id === profile.goal)?.label} · {profile.age}y · {formatWeight(profile.weight_kg, unit)}{unit}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={async () => {
              await recalcAndUse(computeGoals(profile));
            }}
            style={{ ...ghostBtnStyle, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Flame size={14} /> Recalculate targets
          </button>
        </div>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 12 }}>Daily targets</div>
        {goalFields.map(([field, l, unitLabel]) => (
          <div key={field} style={{ marginBottom: 14 }}>
            <label style={label}>{l} {unitLabel && `(${unitLabel})`}</label>
            <input type="number" value={local[field] ?? ""} onChange={(e) => update(field, e.target.value)} style={{ ...inputStyle, width: "100%", marginTop: 4 }} />
          </div>
        ))}
        <div>
          <label style={label}>Goal weight ({unit}, optional)</label>
          <input type="number" step="0.1" value={local.weight_goal_kg ? formatWeight(local.weight_goal_kg, unit) : ""} onChange={(e) => update("weight_goal_kg", e.target.value)} style={{ ...inputStyle, width: "100%", marginTop: 4 }} />
        </div>
      </div>

      <button onClick={save} disabled={saving} style={{ ...primaryBtnStyle, width: "100%", marginTop: 14, opacity: saving ? 0.6 : 1 }}>
        {saved ? "Saved" : saving ? "Saving…" : "Save changes"}
      </button>

      <div style={{ marginTop: 26, paddingTop: 18, borderTop: `1px solid ${COLORS.cardLine}` }}>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: COLORS.inkSoft, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13.5, fontWeight: 600, padding: "8px 0" }}>
          <LogOut size={15} /> Log out
        </button>

        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: COLORS.chili, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13.5, fontWeight: 600, padding: "8px 0" }}>
            <Trash2 size={15} /> Delete account
          </button>
        ) : (
          <div style={{ background: COLORS.chiliSoft, border: `1px solid ${COLORS.chili}44`, borderRadius: 14, padding: 14, marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={15} color={COLORS.chili} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: COLORS.chili }}>Delete your account?</span>
            </div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.ink, marginBottom: 12 }}>
              This permanently deletes your login, food log, weight history, and stats. It can't be undone.
            </div>
            {deleteError && <div style={{ color: COLORS.chili, fontSize: 12, marginBottom: 8, fontFamily: "'Space Grotesk',sans-serif" }}>{deleteError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ ...ghostBtnStyle, flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ ...primaryBtnStyle, flex: 1, background: COLORS.chili, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Add Food Modal ---------------- */

function AddFoodModal({ onClose, onAdd }) {
  const [mode, setMode] = useState("photo");
  const [imgData, setImgData] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState("");
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setImgData({ base64: dataUrl.split(",")[1], mediaType: file.type || "image/jpeg", previewUrl: dataUrl });
      setResult(null);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const r = await analyzeFood({ imageBase64: imgData?.base64, mediaType: imgData?.mediaType, description: mode === "describe" ? description : undefined });
      setResult(r);
    } catch {
      setError("Couldn't analyze that — try again or enter it manually.");
    } finally {
      setLoading(false);
    }
  }

  const filteredFoods = QUICK_FOODS.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(38,34,28,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "88vh", background: COLORS.paper, borderRadius: "22px 22px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 19, color: COLORS.ink }}>Add food</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.inkSoft }}><X size={22} /></button>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "0 18px 14px" }}>
          {[["photo", "Snap photo", <Camera size={14} />], ["describe", "Describe", <PenLine size={14} />], ["quick", "Quick add", <Search size={14} />]].map(([id, label, icon]) => (
            <button key={id} onClick={() => { setMode(id); setResult(null); setError(""); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 6px", borderRadius: 10, fontSize: 12.5, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, border: `1px solid ${mode === id ? COLORS.mangoDeep : COLORS.cardLine}`, background: mode === id ? COLORS.mango : COLORS.card, color: mode === id ? "#fff" : COLORS.ink }}>
              {icon}{label}
            </button>
          ))}
        </div>

        <div style={{ overflowY: "auto", padding: "0 18px 22px", flex: 1 }}>
          {(mode === "photo" || mode === "describe") && !result && (
            <div>
              {mode === "photo" && (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
                  {imgData ? (
                    <img src={imgData.previewUrl} alt="Food preview" style={{ width: "100%", borderRadius: 14, maxHeight: 220, objectFit: "cover" }} />
                  ) : (
                    <button onClick={() => fileRef.current?.click()} style={{ width: "100%", height: 180, borderRadius: 14, border: `1.5px dashed ${COLORS.cardLine}`, background: COLORS.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Camera size={26} color={COLORS.mangoDeep} />
                      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: COLORS.inkSoft }}>Tap to take or choose a photo</span>
                    </button>
                  )}
                  {imgData && <button onClick={() => fileRef.current?.click()} style={{ marginTop: 8, background: "none", border: "none", color: COLORS.sky, fontFamily: "'Space Grotesk',sans-serif", fontSize: 12.5 }}>Choose a different photo</button>}
                </div>
              )}
              {mode === "describe" && (
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. a bowl of chicken ramen with a soft-boiled egg" rows={4} style={{ ...inputStyle, width: "100%", resize: "none" }} />
              )}
              {error && <div style={{ color: COLORS.chili, fontSize: 12.5, marginTop: 10, fontFamily: "'Space Grotesk',sans-serif" }}>{error}</div>}
              <button onClick={runAnalysis} disabled={loading || (mode === "photo" && !imgData) || (mode === "describe" && !description.trim())} style={{ ...primaryBtnStyle, width: "100%", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading || (mode === "photo" && !imgData) || (mode === "describe" && !description.trim()) ? 0.5 : 1 }}>
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {loading ? "Analyzing…" : "Analyze"}
              </button>
            </div>
          )}
          {(mode === "photo" || mode === "describe") && result && (
            <EditableResult result={result} setResult={setResult} onConfirm={() => onAdd(result)} onRetry={() => setResult(null)} />
          )}
          {mode === "quick" && <QuickAddSearch query={query} setQuery={setQuery} onAdd={onAdd} localFoods={filteredFoods} />}
        </div>
      </div>
    </div>
  );
}

function QuickAddSearch({ query, setQuery, onAdd, localFoods }) {
  const debouncedQuery = useDebouncedValue(query, 450);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState(100);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    searchUSDA(debouncedQuery.trim())
      .then((r) => { if (!cancelled) setResults(r); })
      .catch((e) => {
        if (cancelled) return;
        setResults([]);
        setError(e.message === "rate_limited" ? "USDA rate limit hit — add your own free key to .env." : "Couldn't reach the USDA database right now.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  function openFood(food) {
    setSelected(food);
    setGrams(food.servingSize ? Math.round(food.servingSize) : 100);
  }
  function addSelected() {
    const factor = grams / 100;
    onAdd({ name: selected.brand ? `${selected.name} (${selected.brand})` : selected.name, cal: selected.per100.cal * factor, p: selected.per100.p * factor, c: selected.per100.c * factor, f: selected.per100.f * factor });
    setSelected(null);
  }

  if (selected) {
    const factor = grams / 100;
    const preview = { cal: round(selected.per100.cal * factor), p: round(selected.per100.p * factor, 1), c: round(selected.per100.c * factor, 1), f: round(selected.per100.f * factor, 1) };
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: COLORS.inkSoft, fontFamily: "'Space Grotesk',sans-serif", fontSize: 12.5, marginBottom: 10 }}>
          <ChevronLeft size={14} /> Back to results
        </button>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{selected.name}</div>
          {selected.brand && <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>{selected.brand}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft }}>Amount (g)</label>
            <input type="number" value={grams} onChange={(e) => setGrams(Math.max(0, parseFloat(e.target.value) || 0))} style={{ ...inputStyle, width: 90 }} />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 14, fontFamily: "'Space Grotesk',sans-serif" }}>
            <div><div style={{ fontSize: 17, fontWeight: 700, color: COLORS.ink }}>{preview.cal}</div><div style={{ fontSize: 10.5, color: COLORS.inkSoft }}>kcal</div></div>
            <div><div style={{ fontSize: 17, fontWeight: 700, color: COLORS.chili }}>{preview.p}</div><div style={{ fontSize: 10.5, color: COLORS.inkSoft }}>protein</div></div>
            <div><div style={{ fontSize: 17, fontWeight: 700, color: COLORS.mangoDeep }}>{preview.c}</div><div style={{ fontSize: 10.5, color: COLORS.inkSoft }}>carbs</div></div>
            <div><div style={{ fontSize: 17, fontWeight: 700, color: COLORS.sky }}>{preview.f}</div><div style={{ fontSize: 10.5, color: COLORS.inkSoft }}>fat</div></div>
          </div>
          <button onClick={addSelected} style={{ ...primaryBtnStyle, width: "100%", marginTop: 16 }}>Add to log</button>
        </div>
      </div>
    );
  }

  const showLocal = debouncedQuery.trim().length < 2;
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search USDA food database…" style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />
      {error && <div style={{ color: COLORS.chili, fontSize: 12, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 10 }}>{error}</div>}
      {showLocal ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
          {localFoods.map((f) => (
            <button key={f.name} onClick={() => onAdd({ name: f.name, cal: f.cal, p: f.p, c: f.c, f: f.f })} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 12, padding: "11px 14px", textAlign: "left" }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13.5, color: COLORS.ink }}>{f.name}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: COLORS.inkSoft }}>{f.cal} kcal · P{f.p} C{f.c} F{f.f}</div>
              </div>
              <Plus size={17} color={COLORS.mangoDeep} />
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
          {loading && <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, padding: "14px 0" }}><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Searching…</div>}
          {!loading && results.length === 0 && !error && <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: COLORS.inkSoft, textAlign: "center", padding: "18px 0" }}>No matches — try "Describe" instead.</div>}
          {results.map((f) => (
            <button key={f.fdcId} onClick={() => openFood(f)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 12, padding: "11px 14px", textAlign: "left" }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13.5, color: COLORS.ink }}>{f.name}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: COLORS.inkSoft }}>{f.brand ? `${f.brand} · ` : ""}{round(f.per100.cal)} kcal / 100g</div>
              </div>
              <Plus size={17} color={COLORS.mangoDeep} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableResult({ result, setResult, onConfirm, onRetry }) {
  return (
    <div>
      <div style={{ background: COLORS.basilSoft, border: `1px solid ${COLORS.basil}22`, borderRadius: 14, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Check size={14} color={COLORS.basil} />
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.basil, fontWeight: 600 }}>Analyzed ({result.confidence} confidence) — review before saving</span>
        </div>
        <input value={result.name} onChange={(e) => setResult({ ...result, name: e.target.value })} style={{ ...inputStyle, width: "100%", fontWeight: 600, marginBottom: 10, background: COLORS.card }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <NumField label="Calories" value={result.cal} onChange={(v) => setResult({ ...result, cal: v })} />
          <NumField label="Protein (g)" value={result.p} onChange={(v) => setResult({ ...result, p: v })} />
          <NumField label="Carbs (g)" value={result.c} onChange={(v) => setResult({ ...result, c: v })} />
          <NumField label="Fat (g)" value={result.f} onChange={(v) => setResult({ ...result, f: v })} />
        </div>
        {result.note && <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11.5, color: COLORS.inkSoft, marginTop: 10 }}>{result.note}</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onRetry} style={{ ...primaryBtnStyle, background: COLORS.card, color: COLORS.ink, border: `1px solid ${COLORS.cardLine}`, flex: 1 }}>Retry</button>
        <button onClick={onConfirm} style={{ ...primaryBtnStyle, flex: 2 }}>Save to log</button>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10.5, color: COLORS.inkSoft }}>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: "100%", background: COLORS.card, marginTop: 2 }} />
    </div>
  );
}
