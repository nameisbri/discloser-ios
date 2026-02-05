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
      setError(err instanceof Error ? err.message : "We couldn't load your profile. Please check your internet connection and try again.");
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
      setError(err instanceof Error ? err.message : "We couldn't update your risk level. Please check your internet connection and try again.");
      return false;
    }
  };

  const addKnownCondition = async (condition: string, notes?: string): Promise<boolean> => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("addKnownCondition: No authenticated user");
        return false;
      }
      if (!profile) {
        console.error("addKnownCondition: Profile not loaded yet");
        return false;
      }

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
      console.log("addKnownCondition: Successfully added", condition);
      return true;
    } catch (err) {
      console.error("addKnownCondition: Error", err);
      setError(err instanceof Error ? err.message : "We couldn't add this condition. Please check your internet connection and try again.");
      return false;
    }
  };

  const removeKnownCondition = async (condition: string): Promise<boolean> => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("removeKnownCondition: No authenticated user");
        return false;
      }
      if (!profile) {
        console.error("removeKnownCondition: Profile not loaded yet");
        return false;
      }

      const updated = (profile.known_conditions || []).filter((kc) => kc.condition !== condition);

      // @ts-expect-error - Supabase types not generated, runtime types are correct
      const { error: updateError } = await supabase.from("profiles").update({ known_conditions: updated }).eq("id", user.id);
      if (updateError) throw updateError;
      setProfile((prev) => prev ? { ...prev, known_conditions: updated } : null);
      console.log("removeKnownCondition: Successfully removed", condition);
      return true;
    } catch (err) {
      console.error("removeKnownCondition: Error", err);
      setError(err instanceof Error ? err.message : "We couldn't remove this condition. Please check your internet connection and try again.");
      return false;
    }
  };

  const hasKnownCondition = useCallback((stiName: string): boolean => {
    return matchesKnownCondition(stiName, profile?.known_conditions || []);
  }, [profile?.known_conditions]);

  return { profile, loading, error, refetch: fetchProfile, updateRiskLevel, addKnownCondition, removeKnownCondition, hasKnownCondition };
}
