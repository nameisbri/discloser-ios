import { useEffect, useRef } from "react";
import { usePathname } from "expo-router";
import { trackScreenViewed } from "../analytics";

const screenMap: Record<string, string> = {
  dashboard: "home",
  upload: "upload",
  resources: "resources",
  settings: "settings",
  "shared-links": "shared_links",
  reminders: "reminders",
};

function getScreenName(pathname: string): string {
  // Strip leading slash and group prefixes like (protected)/(tabs)/
  const clean = pathname.replace(/^\//,"").replace(/\(.*?\)\//g, "");

  if (screenMap[clean]) return screenMap[clean];

  // Dynamic routes
  if (clean.startsWith("results/")) return "result_detail";

  // Auth screens
  if (pathname.includes("(auth)")) return "auth";

  return clean || "unknown";
}

export function useScreenTracking(): void {
  const pathname = usePathname();
  const previousScreenRef = useRef<string | null>(null);

  useEffect(() => {
    const screenName = getScreenName(pathname);

    if (screenName === previousScreenRef.current) return;

    trackScreenViewed({
      screen_name: screenName,
      previous_screen: previousScreenRef.current,
    });

    previousScreenRef.current = screenName;
  }, [pathname]);
}
