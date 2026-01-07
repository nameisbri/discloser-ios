import { useMemo } from "react";
import { useTestResults } from "./useTestResults";
import type { TestStatus } from "../types";

export interface AggregatedSTI {
  name: string;
  status: TestStatus;
  result: string;
  testDate: string;
  isVerified: boolean;
}

export function useSTIStatus() {
  const { results, loading, error } = useTestResults();

  const aggregatedStatus = useMemo(() => {
    const stiMap = new Map<string, AggregatedSTI>();

    // Process all results, keeping the most recent per STI
    for (const result of results) {
      if (!result.sti_results) continue;

      for (const sti of result.sti_results) {
        const existing = stiMap.get(sti.name);
        const testDate = result.test_date;

        // Keep if no existing or this one is more recent
        if (!existing || testDate > existing.testDate) {
          stiMap.set(sti.name, {
            name: sti.name,
            status: sti.status,
            result: sti.result,
            testDate: testDate,
            isVerified: result.is_verified,
          });
        }
      }
    }

    // Sort by name for consistent display
    return [...stiMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  // Calculate overall status
  const overallStatus = useMemo((): TestStatus => {
    if (aggregatedStatus.length === 0) return "pending";
    const hasPositive = aggregatedStatus.some((s) => s.status === "positive");
    const hasPending = aggregatedStatus.some((s) => s.status === "pending");
    if (hasPositive) return "positive";
    if (hasPending) return "pending";
    return "negative";
  }, [aggregatedStatus]);

  // Get most recent test date
  const lastTestedDate = useMemo(() => {
    if (aggregatedStatus.length === 0) return null;
    return aggregatedStatus.reduce((latest, sti) =>
      sti.testDate > latest ? sti.testDate : latest
    , aggregatedStatus[0].testDate);
  }, [aggregatedStatus]);

  return {
    aggregatedStatus,
    overallStatus,
    lastTestedDate,
    loading,
    error,
  };
}
