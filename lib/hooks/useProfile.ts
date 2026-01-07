import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import type { Profile, RiskLevel } from "../types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateRiskLevel = async (level: RiskLevel) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      risk_level: level,
      risk_assessed_at: new Date().toISOString(),
    }).eq("id", user.id);

    setProfile((prev) => prev ? { ...prev, risk_level: level, risk_assessed_at: new Date().toISOString() } : null);
  };

  return { profile, loading, refetch: fetchProfile, updateRiskLevel };
}
