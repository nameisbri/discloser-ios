import { useMemo } from "react";
import { useTestResults } from "./useTestResults";
import { useProfile } from "./useProfile";
import { isStatusSTI, normalizeTestName } from "../parsing/testNormalizer";
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

    // Process all results, keeping the most recent per STI
    for (const result of results) {
      if (!result.sti_results) continue;

      for (const sti of result.sti_results) {
        const existing = stiMap.get(sti.name);
        const testDate = result.test_date;

        // Keep if no existing or this one is more recent
        if (!existing || testDate > existing.testDate) {
          // Smart matching for known conditions - handles variations like "HSV-1", "Herpes (HSV-1)", "Herpes Simplex Virus 1"
          const isKnown = knownConditions.some((kc) => {
            const cond = kc.condition.toLowerCase();
            const name = sti.name.toLowerCase();
            // Direct match
            if (cond === name) return true;
            // HSV-1 variations
            if ((cond.includes('hsv-1') || cond.includes('hsv1')) &&
                (name.includes('hsv-1') || name.includes('hsv1') || name.includes('herpes simplex virus 1') || name.includes('simplex 1'))) return true;
            // HSV-2 variations
            if ((cond.includes('hsv-2') || cond.includes('hsv2')) &&
                (name.includes('hsv-2') || name.includes('hsv2') || name.includes('herpes simplex virus 2') || name.includes('simplex 2'))) return true;
            // HIV variations
            if (cond.includes('hiv') && name.includes('hiv')) return true;
            // Hepatitis B variations
            if ((cond.includes('hepatitis b') || cond.includes('hep b') || cond.includes('hbv')) &&
                (name.includes('hepatitis b') || name.includes('hep b') || name.includes('hbv'))) return true;
            // Hepatitis C variations
            if ((cond.includes('hepatitis c') || cond.includes('hep c') || cond.includes('hcv')) &&
                (name.includes('hepatitis c') || name.includes('hep c') || name.includes('hcv'))) return true;
            return false;
          });
          stiMap.set(sti.name, {
            name: sti.name,
            status: sti.status,
            result: sti.result,
            testDate: testDate,
            isVerified: result.is_verified,
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
