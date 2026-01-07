import { useMemo } from "react";
import { useTestResults } from "./useTestResults";
import { useProfile } from "./useProfile";
import type { RiskLevel } from "../types";

// Testing intervals in days by risk level
const INTERVALS: Record<RiskLevel, number> = {
  low: 365,      // 12 months
  moderate: 180, // 6 months
  high: 90,      // 3 months
};

export interface TestingRecommendation {
  lastTestDate: string | null;
  nextDueDate: string | null;
  daysUntilDue: number | null;
  isOverdue: boolean;
  isDueSoon: boolean; // within 2 weeks
  riskLevel: RiskLevel | null;
  intervalDays: number | null;
}

export function useTestingRecommendations(): TestingRecommendation {
  const { results } = useTestResults();
  const { profile } = useProfile();

  return useMemo(() => {
    const riskLevel = profile?.risk_level || null;

    if (!riskLevel || results.length === 0) {
      return {
        lastTestDate: results[0]?.test_date || null,
        nextDueDate: null,
        daysUntilDue: null,
        isOverdue: false,
        isDueSoon: false,
        riskLevel,
        intervalDays: riskLevel ? INTERVALS[riskLevel] : null,
      };
    }

    // Get most recent test date
    const lastTestDate = results[0].test_date;
    const intervalDays = INTERVALS[riskLevel];

    // Calculate next due date
    const lastDate = new Date(lastTestDate);
    const nextDue = new Date(lastDate);
    nextDue.setDate(nextDue.getDate() + intervalDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextDue.setHours(0, 0, 0, 0);

    const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      lastTestDate,
      nextDueDate: nextDue.toISOString().split("T")[0],
      daysUntilDue,
      isOverdue: daysUntilDue < 0,
      isDueSoon: daysUntilDue >= 0 && daysUntilDue <= 14,
      riskLevel,
      intervalDays,
    };
  }, [results, profile]);
}

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
