"use client";

import { useEffect, useRef } from "react";

export function ScrollDepthTracker() {
  const milestonesRef = useRef(new Set<number>());

  useEffect(() => {
    const milestones = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !milestonesRef.current.has(milestone)) {
          milestonesRef.current.add(milestone);
          try {
            window.posthog?.capture("page_scroll_depth", {
              depth_percent: milestone,
              page: window.location.pathname,
            });
          } catch {
            // Analytics failure must never affect page behavior
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
