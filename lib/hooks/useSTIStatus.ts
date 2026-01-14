import { useMemo } from "react";
import { useTestResults } from "./useTestResults";
import { useProfile } from "./useProfile";
import { isStatusSTI, normalizeTestName } from "../parsing/testNormalizer";
import { matchesKnownCondition } from "../utils/stiMatching";
import type { TestStatus } from "../types";

export interface AggregatedSTI {
  name: string;
  status: TestStatus;
  result: string;
  testDate: string;
  isVerified: boolean;
  isKnownCondition: boolean;
  isStatusSTI: boolean;
}

export function useSTIStatus() {
  const { results, loading, error } = useTestResults();
  const { profile } = useProfile();

  const aggregatedStatus = useMemo(() => {
    const stiMap = new Map<string, AggregatedSTI>();
    const knownConditions = profile?.known_conditions || [];

    // Process all results, keeping most recent per STI
    for (const result of results) {
      // Handle sti_results that might be null, undefined, or invalid
      const stiResults = result.sti_results;
      if (!stiResults || !Array.isArray(stiResults) || stiResults.length === 0) continue;

      for (const sti of stiResults) {
        // Validate required STI fields
        if (!sti.name || !sti.status) continue;

        const existing = stiMap.get(sti.name);
        const testDate = result.test_date;

        // Keep if no existing or this one is more recent
        if (!existing || testDate > existing.testDate) {
          const isKnown = matchesKnownCondition(sti.name, knownConditions);
          stiMap.set(sti.name, {
            name: sti.name,
            status: sti.status,
            result: sti.result || sti.status.charAt(0).toUpperCase() + sti.status.slice(1),
            testDate: testDate,
            isVerified: result.is_verified || false,
            isKnownCondition: isKnown,
            isStatusSTI: isStatusSTI(sti.name),
          });
        }
      }
    }

    // Sort by name for consistent display
    return [...stiMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [results, profile?.known_conditions]);

  // Separate routine results from known conditions
  const routineStatus = useMemo(() => aggregatedStatus.filter((s) => !s.isKnownCondition), [aggregatedStatus]);
  const knownConditionsStatus = useMemo(() => aggregatedStatus.filter((s) => s.isKnownCondition), [aggregatedStatus]);

  // Detect new positive status STIs not yet marked as known (for prompting user)
  const newStatusPositives = useMemo(
    () => aggregatedStatus.filter((s) => s.isStatusSTI && s.status === "positive" && !s.isKnownCondition),
    [aggregatedStatus]
  );

  // Calculate overall status - EXCLUDES known conditions
  const overallStatus = useMemo((): TestStatus => {
    if (routineStatus.length === 0) return "pending";
    const hasPositive = routineStatus.some((s) => s.status === "positive");
    const hasPending = routineStatus.some((s) => s.status === "pending");
    if (hasPositive) return "positive";
    if (hasPending) return "pending";
    return "negative";
  }, [routineStatus]);

  // Get most recent test date
  const lastTestedDate = useMemo(() => {
    if (aggregatedStatus.length === 0) return null;
    return aggregatedStatus.reduce((latest, sti) =>
      sti.testDate > latest ? sti.testDate : latest
    , aggregatedStatus[0].testDate);
  }, [aggregatedStatus]);

  return {
    aggregatedStatus,
    routineStatus,
    knownConditionsStatus,
    newStatusPositives,
    overallStatus,
    lastTestedDate,
    loading,
    error,
  };
}
