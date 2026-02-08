// Shared testing recommendations computation logic
// Used by both useTestingRecommendations and useDashboardData hooks

import { ROUTINE_TESTS } from "../constants";
import type { TestResult, RiskLevel } from "../types";
import { parseDateOnly, toDateString } from "./date";

/**
 * Testing intervals in days by risk level
 */
export const TESTING_INTERVALS: Record<RiskLevel, number> = {
  low: 365,      // 12 months
  moderate: 180, // 6 months
  high: 90,      // 3 months
};

export const RISK_FREQUENCY: Record<RiskLevel, "monthly" | "quarterly" | "biannual" | "annual"> = {
  low: "annual",
  moderate: "biannual",
  high: "quarterly",
};

const ROUTINE_PANEL_KEYWORDS = ["basic", "full", "std", "sti", "routine", "panel", "4-test"];

/**
 * Checks if a test result contains routine tests
 */
export function hasRoutineTests(result: TestResult): boolean {
  // Check sti_results for routine tests
  const hasRoutineSTI = result.sti_results?.some((sti) =>
    ROUTINE_TESTS.some((routine) => sti.name.toLowerCase().includes(routine))
  );
  if (hasRoutineSTI) return true;

  // Fallback: check test_type for routine panel keywords
  const testType = result.test_type?.toLowerCase() || "";
  return ROUTINE_PANEL_KEYWORDS.some((kw) => testType.includes(kw));
}

/**
 * Returns the most recent routine test date across existing results and a
 * candidate date. Used during upload to determine the correct base date
 * for reminder calculation — prevents older uploads from overriding
 * reminders set by newer test results.
 */
export function getMostRecentRoutineTestDate(
  existingResults: TestResult[],
  candidateDate: string,
  candidateHasRoutineTests: boolean
): string {
  const existingRoutineDates = existingResults
    .filter(hasRoutineTests)
    .map((r) => r.test_date);

  if (candidateHasRoutineTests) {
    existingRoutineDates.push(candidateDate);
  }

  if (existingRoutineDates.length === 0) {
    return candidateDate;
  }

  // YYYY-MM-DD strings sort lexicographically in chronological order
  return existingRoutineDates.reduce((latest, d) => (d > latest ? d : latest));
}

export interface TestingRecommendation {
  lastTestDate: string | null;
  nextDueDate: string | null;
  daysUntilDue: number | null;
  isOverdue: boolean;
  isDueSoon: boolean; // within 2 weeks
  riskLevel: RiskLevel | null;
  intervalDays: number | null;
}

/**
 * Computes testing recommendations based on test results and risk level.
 * This is the core computation logic used by multiple hooks.
 *
 * @param results - Array of test results from the database
 * @param riskLevel - User's risk level from their profile
 * @returns Computed testing recommendation with due dates and status
 */
export function computeTestingRecommendation(
  results: TestResult[],
  riskLevel: RiskLevel | null
): TestingRecommendation {
  // Only consider results with routine tests for reminder calculation
  const routineResults = results.filter(hasRoutineTests);

  if (!riskLevel || routineResults.length === 0) {
    return {
      lastTestDate: routineResults[0]?.test_date || null,
      nextDueDate: null,
      daysUntilDue: null,
      isOverdue: false,
      isDueSoon: false,
      riskLevel,
      intervalDays: riskLevel ? TESTING_INTERVALS[riskLevel] : null,
    };
  }

  // Get most recent routine test date
  const lastTestDate = routineResults[0].test_date;
  const intervalDays = TESTING_INTERVALS[riskLevel];

  // Calculate next due date — use parseDateOnly to avoid UTC timezone shift
  const lastDate = parseDateOnly(lastTestDate);
  const nextDue = new Date(lastDate);
  nextDue.setDate(nextDue.getDate() + intervalDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDue.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    lastTestDate,
    nextDueDate: toDateString(nextDue),
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
    isDueSoon: daysUntilDue >= 0 && daysUntilDue <= 14,
    riskLevel,
    intervalDays,
  };
}

/**
 * Formats a testing recommendation into a user-friendly message
 */
export function formatDueMessage(rec: TestingRecommendation): string | null {
  if (!rec.riskLevel || rec.daysUntilDue === null) return null;

  if (rec.isOverdue) {
    const days = Math.abs(rec.daysUntilDue);
    return `You're ${days} day${days !== 1 ? "s" : ""} overdue for testing`;
  }

  if (rec.isDueSoon) {
    if (rec.daysUntilDue === 0) return "Your next test is due today";
    return `Your next test is due in ${rec.daysUntilDue} day${rec.daysUntilDue !== 1 ? "s" : ""}`;
  }

  return null;
}

// Days to first test when user has no results yet
const FIRST_TEST_NUDGE_DAYS = 7;

/**
 * Computes the expected next reminder date based on results and risk level.
 * Single source of truth for what a reminder's next_date should be.
 *
 * - Has routine results → most_recent_routine_date + interval
 * - No routine results → today + 7 days (encourages getting tested soon)
 * - No risk level → null
 */
export function computeExpectedNextDate(
  results: TestResult[],
  riskLevel: RiskLevel | null
): string | null {
  if (!riskLevel) return null;

  const routineResults = results.filter(hasRoutineTests);

  let baseDate: Date;
  let intervalDays: number;

  if (routineResults.length > 0) {
    // Results are sorted descending by test_date from the query
    baseDate = parseDateOnly(routineResults[0].test_date);
    intervalDays = TESTING_INTERVALS[riskLevel];
  } else {
    // No results yet — nudge to get tested within the week
    baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    intervalDays = FIRST_TEST_NUDGE_DAYS;
  }

  const nextDue = new Date(baseDate);
  nextDue.setDate(nextDue.getDate() + intervalDays);
  return toDateString(nextDue);
}
