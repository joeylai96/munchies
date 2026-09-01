import React, { useState } from "react";
import { COLORS, inputStyle, primaryBtnStyle } from "../lib/theme";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, PACE_OPTIONS, computeGoals, ftInToCm, lbToKg, round } from "../lib/goals";

const AVATARS = ["🥑", "🍎", "🍔", "🥦", "🍕", "🍩", "🍇", "🥕", "🍳", "🍜"];

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [sex, setSex] = useState("female");
  const [age, setAge] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [heightCmVal, setHeightCmVal] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [weightVal, setWeightVal] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [activity, setActivity] = useState("light");
  const [goal, setGoal] = useState("maintain");
  const [pace, setPace] = useState("moderate");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return setError("Give yourself a name.");
    const height_cm = heightUnit === "cm" ? Number(heightCmVal) : ftInToCm(heightFt, heightIn);
    const weight_kg = weightUnit === "lb" ? lbToKg(Number(weightVal) || 0) : Number(weightVal) || 0;
    if (!height_cm || !weight_kg || !age) return setError("Height, weight, and age are needed to calculate your targets.");

    setError("");
    setSaving(true);
    const stats = {
      name: name.trim(),
      avatar,
      sex,
      age: Number(age),
      height_cm: round(height_cm, 1),
      height_unit: heightUnit,
      weight_kg: round(weight_kg, 1),
      weight_unit: weightUnit,
      body_fat_pct: bodyFatPct ? Number(bodyFatPct) : null,
      activity,
      goal,
      pace,
    };
    const goals = computeGoals(stats);
    try {
      await onComplete({ ...stats, ...goals, onboarded: true });
    } catch (e) {
      setError(e.message || "Something went wrong saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  const sectionLabel = { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12.5, color: COLORS.mangoDeep, marginBottom: 10, marginTop: 4 };
  const label = { fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: COLORS.inkSoft };

  return (
    <div style={{ width: "100%", maxWidth: 420, minHeight: "100%", padding: "36px 24px 48px", margin: "0 auto" }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 26, color: COLORS.ink }}>Set up your profile</div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: COLORS.inkSoft, marginTop: 4, marginBottom: 22 }}>
        Used to calculate your personal calorie & macro targets. You can edit anything later.
      </div>

      <div style={sectionLabel}>About you</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {AVATARS.map((a) => (
          <button key={a} onClick={() => setAvatar(a)} style={{ width: 42, height: 42, borderRadius: 12, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", background: avatar === a ? COLORS.mango : COLORS.card, border: `1px solid ${avatar === a ? COLORS.mangoDeep : COLORS.cardLine}` }}>
            {a}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["female", "male"].map((s) => (
          <button key={s} onClick={() => setSex(s)} style={{ flex: 1, padding: "9px 10px", borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13, background: sex === s ? COLORS.ink : COLORS.card, color: sex === s ? "#fff" : COLORS.ink, border: `1px solid ${sex === s ? COLORS.ink : COLORS.cardLine}`, textTransform: "capitalize" }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={label}>Age</label>
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
      </div>

      <div style={sectionLabel}>Body stats</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={label}>Height</label>
          <UnitSwitch options={["cm", "ft"]} value={heightUnit} onChange={setHeightUnit} />
        </div>
        {heightUnit === "cm" ? (
          <input type="number" value={heightCmVal} onChange={(e) => setHeightCmVal(e.target.value)} placeholder="cm" style={{ ...inputStyle, width: "100%" }} />
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="ft" style={inputStyle} />
            <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="in" style={inputStyle} />
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={label}>Weight</label>
          <UnitSwitch options={["kg", "lb"]} value={weightUnit} onChange={setWeightUnit} />
        </div>
        <input type="number" step="0.1" value={weightVal} onChange={(e) => setWeightVal(e.target.value)} placeholder={weightUnit} style={{ ...inputStyle, width: "100%" }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={label}>Body fat % (optional, improves accuracy)</label>
        <input type="number" step="0.1" value={bodyFatPct} onChange={(e) => setBodyFatPct(e.target.value)} placeholder="Leave blank if unsure" style={{ ...inputStyle, width: "100%" }} />
      </div>

      <div style={sectionLabel}>Activity level</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
        {ACTIVITY_OPTIONS.map((o) => (
          <button key={o.id} onClick={() => setActivity(o.id)} style={{ textAlign: "left", padding: "10px 13px", borderRadius: 12, background: activity === o.id ? COLORS.mango : COLORS.card, border: `1px solid ${activity === o.id ? COLORS.mangoDeep : COLORS.cardLine}` }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13.5, color: activity === o.id ? "#fff" : COLORS.ink }}>{o.label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: activity === o.id ? "rgba(255,255,255,0.85)" : COLORS.inkSoft }}>{o.desc}</div>
          </button>
        ))}
      </div>

      <div style={sectionLabel}>Goal</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: goal !== "maintain" ? 12 : 16 }}>
        {GOAL_OPTIONS.map((g) => (
          <button key={g.id} onClick={() => setGoal(g.id)} style={{ padding: "11px 10px", borderRadius: 12, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13, background: goal === g.id ? COLORS.basil : COLORS.card, color: goal === g.id ? "#fff" : COLORS.ink, border: `1px solid ${goal === g.id ? COLORS.basil : COLORS.cardLine}` }}>
            {g.label}
          </button>
        ))}
      </div>

      {goal !== "maintain" && (
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Pace</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {PACE_OPTIONS.map((p) => (
              <button key={p.id} onClick={() => setPace(p.id)} style={{ flex: 1, padding: "9px 4px", borderRadius: 10, background: pace === p.id ? COLORS.sky : COLORS.card, border: `1px solid ${pace === p.id ? COLORS.sky : COLORS.cardLine}` }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12, color: pace === p.id ? "#fff" : COLORS.ink }}>{p.label}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: pace === p.id ? "rgba(255,255,255,0.85)" : COLORS.inkSoft }}>~{p.kcal} kcal/day</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div style={{ color: COLORS.chili, fontSize: 12.5, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 12 }}>{error}</div>}
      <button onClick={handleSubmit} disabled={saving} style={{ ...primaryBtnStyle, width: "100%", opacity: saving ? 0.6 : 1 }}>
        {saving ? "Setting up…" : "Create profile & calculate my targets"}
      </button>
    </div>
  );
}

function UnitSwitch({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: COLORS.card, border: `1px solid ${COLORS.cardLine}`, borderRadius: 8, padding: 2 }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{ padding: "3px 9px", borderRadius: 6, fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 600, background: value === o ? COLORS.mango : "transparent", color: value === o ? "#fff" : COLORS.inkSoft, border: "none" }}>
          {o}
        </button>
      ))}
    </div>
  );
}
