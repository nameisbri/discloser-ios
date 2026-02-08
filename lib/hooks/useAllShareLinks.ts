import { useState, useCallback } from "react";
import { supabase } from "../supabase";
import { logger } from "../utils/logger";
import type { ShareLink, StatusShareLink, UnifiedShareLink, ShareLinkType } from "../types";

function normalizeShareLink(link: ShareLink): UnifiedShareLink {
  return {
    id: link.id,
    type: "result",
    token: link.token,
    label: link.label,
    expires_at: link.expires_at,
    view_count: link.view_count,
    max_views: link.max_views,
    show_name: link.show_name,
    display_name: link.display_name,
    created_at: link.created_at,
    note: link.note,
    test_result_id: link.test_result_id,
  };
}

function normalizeStatusShareLink(link: StatusShareLink): UnifiedShareLink {
  return {
    id: link.id,
    type: "status",
    token: link.token,
    label: link.label,
    expires_at: link.expires_at,
    view_count: link.view_count,
    max_views: link.max_views,
    show_name: link.show_name,
    display_name: link.display_name,
    created_at: link.created_at,
    note: null,
    test_result_id: null,
  };
}

export function getUnifiedShareUrl(link: UnifiedShareLink): string {
  const baseUrl = (process.env.EXPO_PUBLIC_SHARE_BASE_URL || "https://discloser.app").trim();
  return link.type === "status"
    ? `${baseUrl}/status/${link.token}`
    : `${baseUrl}/share/${link.token}`;
}

export function useAllShareLinks() {
  const [links, setLinks] = useState<UnifiedShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [resultRes, statusRes] = await Promise.all([
        supabase
          .from("share_links")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("status_share_links")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (resultRes.error) throw resultRes.error;
      if (statusRes.error) throw statusRes.error;

      const normalizedResults = (resultRes.data || []).map(normalizeShareLink);
      const normalizedStatus = (statusRes.data || []).map(normalizeStatusShareLink);

      const merged = [...normalizedResults, ...normalizedStatus].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setLinks(merged);
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't load your share links. Please check your internet connection and try again.";
      setError(message);
      logger.error("useAllShareLinks fetch error", { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLink = useCallback(async (id: string, type: ShareLinkType): Promise<boolean> => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const table = type === "result" ? "share_links" : "status_share_links";
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setLinks((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't delete this share link. Please try again.");
      logger.error("useAllShareLinks delete error", { error: err });
      return false;
    }
  }, []);

  return { links, loading, error, refetch, deleteLink };
}
