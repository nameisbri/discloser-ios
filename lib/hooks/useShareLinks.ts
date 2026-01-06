import { useState, useCallback, useEffect } from "react";
import { supabase } from "../supabase";
import type { ShareLink, CreateShareLinkInput, SharedResult } from "../types";

export function useShareLinks(testResultId?: string) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!testResultId) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("share_links")
        .select("*")
        .eq("test_result_id", testResultId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setLinks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch share links");
    } finally {
      setLoading(false);
    }
  }, [testResultId]);

  const createShareLink = async (
    input: Omit<CreateShareLinkInput, "test_result_id">
  ): Promise<ShareLink | null> => {
    if (!testResultId) {
      setError("No test result ID provided");
      return null;
    }

    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error: createError } = await supabase
        .from("share_links")
        .insert({
          ...input,
          test_result_id: testResultId,
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      
      setLinks((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share link");
      return null;
    }
  };

  const deleteShareLink = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from("share_links")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      
      setLinks((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete share link");
      return false;
    }
  };

  return {
    links,
    loading,
    error,
    fetchLinks,
    createShareLink,
    deleteShareLink,
  };
}

// Utility to generate share URL
export function getShareUrl(token: string): string {
  // This would be your web domain for the share page
  // For now, we'll use a placeholder that can be configured
  const baseUrl = process.env.EXPO_PUBLIC_SHARE_BASE_URL || "https://discloser.app/share";
  return `${baseUrl}/${token}`;
}

// Hook for fetching shared result (public, no auth required)
export function useSharedResult(token: string | undefined) {
  const [result, setResult] = useState<SharedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedResult = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the RPC function to get shared result
      const { data, error: fetchError } = await supabase
        .rpc("get_shared_result", { share_token: token });

      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        setResult(data[0]);
        // Increment view count
        await supabase.rpc("increment_share_view", { share_token: token });
      } else {
        setError("Share link is invalid or expired");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch shared result");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSharedResult();
  }, [fetchSharedResult]);

  return { result, loading, error, refetch: fetchSharedResult };
}

