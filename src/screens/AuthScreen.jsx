import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, inputStyle, primaryBtnStyle, ghostBtnStyle } from "../lib/theme";

export default function AuthScreen() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleEmailAuth(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider) {
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(err.message);
  }

  return (
    <div style={{ width: "100%", maxWidth: 420, minHeight: "100%", padding: "48px 24px", margin: "0 auto" }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 34, color: COLORS.ink, letterSpacing: "-0.5px" }}>
        Munchies
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, color: COLORS.inkSoft, marginTop: 4, marginBottom: 28 }}>
        Track your calories with just a picture.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <button onClick={() => handleOAuth("google")} style={{ ...ghostBtnStyle, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          Continue with Google
        </button>
        <button onClick={() => handleOAuth("github")} style={{ ...ghostBtnStyle, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          Continue with GitHub
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0", color: COLORS.inkSoft, fontFamily: "'Space Grotesk',sans-serif", fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: COLORS.cardLine }} />
        or with email
        <div style={{ flex: 1, height: 1, background: COLORS.cardLine }} />
      </div>

      <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ ...inputStyle, width: "100%" }} />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ ...inputStyle, width: "100%" }} />
        {error && <div style={{ color: COLORS.chili, fontSize: 12.5, fontFamily: "'Space Grotesk',sans-serif" }}>{error}</div>}
        {message && <div style={{ color: COLORS.basil, fontSize: 12.5, fontFamily: "'Space Grotesk',sans-serif" }}>{message}</div>}
        <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, width: "100%", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setMessage(""); }}
        style={{ background: "none", border: "none", color: COLORS.sky, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, marginTop: 16 }}
      >
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </div>
  );
}
