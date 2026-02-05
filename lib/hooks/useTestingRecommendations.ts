import { useMemo } from "react";
import { useProfile } from "./useProfile";
import { computeTestingRecommendation } from "../utils/testingRecommendations";
import type { TestResult } from "../types";

// Re-export for backwards compatibility
export { formatDueMessage } from "../utils/testingRecommendations";
export type { TestingRecommendation } from "../utils/testingRecommendations";

export function useTestingRecommendations(results: TestResult[]) {
  const { profile } = useProfile();

  return useMemo(
    () => computeTestingRecommendation(results, profile?.risk_level || null),
    [results, profile?.risk_level]
  );
}
