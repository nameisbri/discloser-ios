import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "@first_visit:";

export function useFirstVisit(screenKey: string) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY_PREFIX + screenKey)
      .then((value) => {
        setIsFirstVisit(value === null);
      })
      .catch(() => {
        setIsFirstVisit(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [screenKey]);

  const markVisited = useCallback(async () => {
    setIsFirstVisit(false);
    try {
      await AsyncStorage.setItem(KEY_PREFIX + screenKey, "1");
    } catch {
      // Silently fail — banner will just show again next time
    }
  }, [screenKey]);

  return { isFirstVisit, loading, markVisited };
}
