// Shared STI status computation logic
// Used by both useSTIStatus and useDashboardData hooks

import { isStatusSTI } from "../parsing/testNormalizer";
import { matchesKnownCondition, findMatchingKnownCondition } from "./stiMatching";
import { toDateString } from "./date";
import type { TestResult, TestStatus, KnownCondition } from "../types";

export interface AggregatedSTI {
  name: string;
  status: TestStatus;
  result: string;
  testDate: string;
  isVerified: boolean;
  verificationLevel?: string | null;
  isKnownCondition: boolean;
  isStatusSTI: boolean;
  /**
   * Indicates whether this STI entry is derived from actual test result data.
   * - true: STI comes from a test result (sti_results array)
   * - false: STI comes from profile's known_conditions without corresponding test data
   * This distinction allows UI to display known conditions even when they lack recent test results.
   */
  hasTestData?: boolean;
  /** Management methods declared by user for this known condition */
  managementMethods?: string[];
}

export interface STIStatusResult {
  aggregatedStatus: AggregatedSTI[];
  routineStatus: AggregatedSTI[];
  knownConditionsStatus: AggregatedSTI[];
  newStatusPositives: AggregatedSTI[];
  overallStatus: TestStatus;
  lastTestedDate: string | null;
}

/**
 * Computes aggregated STI status from test results and known conditions.
 * This is the core computation logic used by multiple hooks.
 *
 * @param results - Array of test results from the database
 * @param knownConditions - Array of known conditions from the user's profile
 * @returns Computed STI status including aggregated results and derived states
 */
export function computeSTIStatus(
  results: TestResult[],
  knownConditions: KnownCondition[] = []
): STIStatusResult {
  const stiMap = new Map<string, AggregatedSTI>();

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
        const matchedKc = findMatchingKnownCondition(sti.name, knownConditions);
        stiMap.set(sti.name, {
          name: sti.name,
          status: sti.status,
          result: sti.result || sti.status.charAt(0).toUpperCase() + sti.status.slice(1),
          testDate: testDate,
          isVerified: result.is_verified || false,
          verificationLevel: result.verification_level,
          isKnownCondition: !!matchedKc,
          isStatusSTI: isStatusSTI(sti.name),
          hasTestData: true,
          managementMethods: matchedKc?.management_methods,
        });
      }
    }
  }

  // Add known conditions that don't have test results
  for (const kc of knownConditions) {
    // Check if this known condition matches any existing STI in the map
    let foundMatch = false;
    for (const [stiName, stiData] of stiMap.entries()) {
      if (matchesKnownCondition(stiName, [kc])) {
        // Found a test result that matches this known condition
        stiMap.set(stiName, { ...stiData, hasTestData: true });
        foundMatch = true;
        break;
      }
    }

    // If no matching test result found in the map, do a reverse lookup
    // through raw test results to catch name-variation edge cases
    if (!foundMatch) {
      let bestTestDate: string | null = null;
      let bestTestVerified = false;
      let bestTestVerificationLevel: string | null = null;

      for (const result of results) {
        if (!result.sti_results || !Array.isArray(result.sti_results)) continue;
        for (const sti of result.sti_results) {
          if (!sti.name) continue;
          if (matchesKnownCondition(sti.name, [kc])) {
            if (!bestTestDate || result.test_date > bestTestDate) {
              bestTestDate = result.test_date;
              bestTestVerified = result.is_verified || false;
              bestTestVerificationLevel = result.verification_level ?? null;
            }
          }
        }
      }

      if (bestTestDate) {
        // Found test data via reverse lookup
        stiMap.set(kc.condition, {
          name: kc.condition,
          status: "pending",
          result: "Not recently tested",
          testDate: bestTestDate,
          isVerified: bestTestVerified,
          verificationLevel: bestTestVerificationLevel,
          isKnownCondition: true,
          isStatusSTI: isStatusSTI(kc.condition),
          hasTestData: true,
          managementMethods: kc.management_methods,
        });
      } else {
        // No test data found — use declaration date
        const dateOnly = kc.added_at ? kc.added_at.split('T')[0] : toDateString(new Date());
        stiMap.set(kc.condition, {
          name: kc.condition,
          status: "pending",
          result: "Not recently tested",
          testDate: dateOnly,
          isVerified: false,
          verificationLevel: null,
          isKnownCondition: true,
          isStatusSTI: isStatusSTI(kc.condition),
          hasTestData: false,
          managementMethods: kc.management_methods,
        });
      }
    }
  }

  // Sort by name for consistent display
  const aggregatedStatus = [...stiMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  // Separate routine results from known conditions
  const routineStatus = aggregatedStatus.filter((s) => !s.isKnownCondition);
  const knownConditionsStatus = aggregatedStatus.filter((s) => s.isKnownCondition);

  // Detect new positive status STIs not yet marked as known (for prompting user)
  const newStatusPositives = aggregatedStatus.filter(
    (s) => s.isStatusSTI && s.status === "positive" && !s.isKnownCondition
  );

  // Calculate overall status - EXCLUDES known conditions
  let overallStatus: TestStatus = "pending";
  if (routineStatus.length > 0) {
    const hasPositive = routineStatus.some((s) => s.status === "positive");
    const hasPending = routineStatus.some((s) => s.status === "pending");
    if (hasPositive) overallStatus = "positive";
    else if (hasPending) overallStatus = "pending";
    else overallStatus = "negative";
  }

  // Get most recent test date
  const lastTestedDate = aggregatedStatus.length === 0
    ? null
    : aggregatedStatus.reduce((latest, sti) =>
        sti.testDate > latest ? sti.testDate : latest
      , aggregatedStatus[0].testDate);

  return {
    aggregatedStatus,
    routineStatus,
    knownConditionsStatus,
    newStatusPositives,
    overallStatus,
    lastTestedDate,
  };
}
