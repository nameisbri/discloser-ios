/**
 * Shared utility for classifying share link expiration status.
 * Used by both ShareModal and StatusShareModal.
 */

export type LinkExpirationStatus = "active" | "time_expired" | "views_exhausted";

interface LinkFields {
  expires_at: string;
  view_count: number;
  max_views: number | null;
}

/**
 * Classifies a share link's expiration status from its existing DB fields.
 * Time-expired takes precedence over views-exhausted (matches DB RPC behavior).
 */
export function getLinkExpirationStatus(link: LinkFields): LinkExpirationStatus {
  if (new Date(link.expires_at) <= new Date()) return "time_expired";
  if (link.max_views !== null && link.view_count >= link.max_views) return "views_exhausted";
  return "active";
}

/**
 * Returns true if the link is expired (by time or views).
 */
export function isLinkExpired(link: LinkFields): boolean {
  return getLinkExpirationStatus(link) !== "active";
}

/**
 * Returns a human-readable label for the expiration status.
 */
export function getExpirationLabel(status: LinkExpirationStatus): string {
  switch (status) {
    case "time_expired":
      return "Expired";
    case "views_exhausted":
      return "Max views reached";
    case "active":
      return "";
  }
}

/**
 * Formats the view count for display on expired links.
 * e.g., "Viewed 1/1 times" or "Viewed 3 times"
 */
export function formatViewCount(viewCount: number, maxViews: number | null): string {
  if (maxViews !== null) {
    return `Viewed ${viewCount}/${maxViews} time${maxViews !== 1 ? "s" : ""}`;
  }
  return `Viewed ${viewCount} time${viewCount !== 1 ? "s" : ""}`;
}
