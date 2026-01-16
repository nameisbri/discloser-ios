import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { matchesKnownCondition } from "../utils/stiMatching";
import type { Profile, RiskLevel, KnownCondition } from "../types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateRiskLevel = async (level: RiskLevel): Promise<boolean> => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // @ts-expect-error - Supabase types not generated, runtime types are correct
      const { error: updateError } = await supabase.from("profiles").update({
        risk_level: level,
        risk_assessed_at: new Date().toISOString(),
      }).eq("id", user.id);

      if (updateError) throw updateError;
      setProfile((prev) => prev ? { ...prev, risk_level: level, risk_assessed_at: new Date().toISOString() } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update risk level");
      return false;
    }
  };

  const addKnownCondition = async (condition: string, notes?: string): Promise<boolean> => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return false;

      const newCondition: KnownCondition = {
        condition,
        added_at: new Date().toISOString(),
        notes,
      };
      const updated = [...(profile.known_conditions || []), newCondition];

      // @ts-expect-error - Supabase types not generated, runtime types are correct
      const { error: updateError } = await supabase.from("profiles").update({ known_conditions: updated }).eq("id", user.id);
      if (updateError) throw updateError;
      setProfile((prev) => prev ? { ...prev, known_conditions: updated } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add condition");
      return false;
    }
  };

  const removeKnownCondition = async (condition: string): Promise<boolean> => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return false;

      const updated = (profile.known_conditions || []).filter((kc) => kc.condition !== condition);

      // @ts-expect-error - Supabase types not generated, runtime types are correct
      const { error: updateError } = await supabase.from("profiles").update({ known_conditions: updated }).eq("id", user.id);
      if (updateError) throw updateError;
      setProfile((prev) => prev ? { ...prev, known_conditions: updated } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove condition");
      return false;
    }
  };

  const hasKnownCondition = useCallback((stiName: string): boolean => {
    return matchesKnownCondition(stiName, profile?.known_conditions || []);
  }, [profile?.known_conditions]);

  return { profile, loading, error, refetch: fetchProfile, updateRiskLevel, addKnownCondition, removeKnownCondition, hasKnownCondition };
}
