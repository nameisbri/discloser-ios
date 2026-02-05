import { useMemo } from "react";
import { useTestResults } from "./useTestResults";
import { useProfile } from "./useProfile";
import { computeSTIStatus } from "../utils/stiStatusComputation";

// Re-export for backwards compatibility
export type { AggregatedSTI } from "../utils/stiStatusComputation";

export function useSTIStatus() {
  const { results, loading, error, refetch } = useTestResults();
  const { profile, refetch: refetchProfile } = useProfile();

  const stiStatus = useMemo(
    () => computeSTIStatus(results, profile?.known_conditions || []),
    [results, profile?.known_conditions]
  );

  return {
    ...stiStatus,
    loading,
    error,
    refetch,
    refetchProfile,
  };
}
