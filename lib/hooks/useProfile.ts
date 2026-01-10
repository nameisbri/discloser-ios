import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import type { Profile, RiskLevel, KnownCondition } from "../types";

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

  const addKnownCondition = async (condition: string, notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;

    const newCondition: KnownCondition = {
      condition,
      added_at: new Date().toISOString(),
      notes,
    };
    const updated = [...(profile.known_conditions || []), newCondition];

    await supabase.from("profiles").update({ known_conditions: updated }).eq("id", user.id);
    setProfile((prev) => prev ? { ...prev, known_conditions: updated } : null);
  };

  const removeKnownCondition = async (condition: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;

    const updated = (profile.known_conditions || []).filter((kc) => kc.condition !== condition);

    await supabase.from("profiles").update({ known_conditions: updated }).eq("id", user.id);
    setProfile((prev) => prev ? { ...prev, known_conditions: updated } : null);
  };

  const hasKnownCondition = useCallback((stiName: string): boolean => {
    // Smart matching for known conditions - handles variations
    return (profile?.known_conditions || []).some((kc) => {
      const cond = kc.condition.toLowerCase();
      const name = stiName.toLowerCase();
      if (cond === name) return true;
      // HSV-1 variations
      if ((cond.includes('hsv-1') || cond.includes('hsv1')) &&
          (name.includes('hsv-1') || name.includes('hsv1') || name.includes('herpes simplex virus 1') || name.includes('simplex 1'))) return true;
      // HSV-2 variations
      if ((cond.includes('hsv-2') || cond.includes('hsv2')) &&
          (name.includes('hsv-2') || name.includes('hsv2') || name.includes('herpes simplex virus 2') || name.includes('simplex 2'))) return true;
      // HIV variations
      if (cond.includes('hiv') && name.includes('hiv')) return true;
      // Hepatitis B/C variations
      if ((cond.includes('hepatitis b') || cond.includes('hbv')) && (name.includes('hepatitis b') || name.includes('hbv'))) return true;
      if ((cond.includes('hepatitis c') || cond.includes('hcv')) && (name.includes('hepatitis c') || name.includes('hcv'))) return true;
      return false;
    });
  }, [profile?.known_conditions]);

  return { profile, loading, refetch: fetchProfile, updateRiskLevel, addKnownCondition, removeKnownCondition, hasKnownCondition };
}
