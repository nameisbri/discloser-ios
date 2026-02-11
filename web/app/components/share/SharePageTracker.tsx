"use client";

import { useEffect, useRef } from "react";

interface SharePageTrackerProps {
  event: "share_link_opened" | "share_link_expired";
  properties: Record<string, unknown>;
}

export function SharePageTracker({ event, properties }: SharePageTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // PostHog JS loads via lazyOnload — may not be ready immediately
    const timer = setTimeout(() => {
      try {
        window.posthog?.capture(event, properties);
      } catch {
        // Analytics failure must never affect share page rendering
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [event, properties]);

  return null;
}
