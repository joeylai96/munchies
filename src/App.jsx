import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { globalFontStyle, COLORS } from "./lib/theme";
import * as db from "./lib/db";
import AuthScreen from "./screens/AuthScreen";
import Onboarding from "./screens/Onboarding";
import MainApp from "./screens/MainApp";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = not checked yet
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadProfile = useCallback(async (userId) => {
    setLoadingProfile(true);
    try {
      const p = await db.getProfile(userId);
      setProfile(p);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadProfile(session.user.id);
    else setProfile(null);
  }, [session, loadProfile]);

  async function handleOnboardingComplete(stats) {
    const updated = await db.upsertProfile(session.user.id, stats);
    setProfile(updated);
  }

  async function handleProfileChange(fields) {
    const updated = await db.upsertProfile(session.user.id, fields);
    setProfile(updated);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  function handleAccountDeleted() {
    setSession(null);
    setProfile(null);
  }

  const shellStyle = { background: COLORS.paper, minHeight: "100vh", display: "flex", justifyContent: "center" };

  let body;
  if (session === undefined) {
    body = <Centered>Loading…</Centered>;
  } else if (!session) {
    body = <AuthScreen />;
  } else if (loadingProfile || profile === null) {
    body = <Centered>Loading your profile…</Centered>;
  } else if (!profile.onboarded) {
    body = <Onboarding onComplete={handleOnboardingComplete} />;
  } else {
    body = (
      <MainApp
        profile={profile}
        onProfileChange={handleProfileChange}
        onLogout={handleLogout}
        onAccountDeleted={handleAccountDeleted}
      />
    );
  }

  return (
    <div style={shellStyle}>
      <style>{globalFontStyle}</style>
      {body}
    </div>
  );
}

function Centered({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: COLORS.inkSoft, fontFamily: "'Space Grotesk',sans-serif" }}>
      {children}
    </div>
  );
}
