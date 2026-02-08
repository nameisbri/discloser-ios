import { useEffect, useRef } from "react";
import type { TestResult, Reminder, RiskLevel, CreateReminderInput } from "../types";
import { computeExpectedNextDate, RISK_FREQUENCY } from "../utils/testingRecommendations";

interface UseReminderSyncOptions {
  results: TestResult[];
  riskLevel: RiskLevel | null;
  activeReminders: Reminder[];
  createReminder: (input: CreateReminderInput) => Promise<Reminder | null>;
  deleteReminder: (id: string) => Promise<boolean>;
}

/**
 * Ensures a "Routine Checkup" reminder always exists and is deduplicated.
 *
 * This hook only CREATES and DEDUPLICATES — it never overrides the date
 * on an existing reminder. Date updates happen in the upload flow when
 * new test data arrives. This respects manual user edits to reminder dates.
 */
export function useReminderSync({
  results,
  riskLevel,
  activeReminders,
  createReminder,
  deleteReminder,
}: UseReminderSyncOptions): void {
  const isSyncingRef = useRef(false);

  const routineReminders = activeReminders.filter((r) => r.title === "Routine Checkup");
  const duplicateCount = routineReminders.length;
  const hasRoutineReminder = duplicateCount > 0;
  const resultCount = results.length;

  useEffect(() => {
    if (!riskLevel) return;
    if (isSyncingRef.current) return;

    const needsCreate = !hasRoutineReminder;
    const needsDedup = duplicateCount > 1;

    if (!needsCreate && !needsDedup) return;

    async function sync() {
      isSyncingRef.current = true;
      try {
        if (needsCreate) {
          // No Routine Checkup exists — create one with the computed date
          const expectedDate = computeExpectedNextDate(results, riskLevel);
          if (expectedDate) {
            await createReminder({
              title: "Routine Checkup",
              frequency: RISK_FREQUENCY[riskLevel!],
              next_date: expectedDate,
              is_active: true,
            });
          }
        } else if (needsDedup) {
          // Keep the first Routine Checkup, delete the rest
          for (let i = 1; i < routineReminders.length; i++) {
            await deleteReminder(routineReminders[i].id);
          }
        }
      } catch {
        // Silent fail — will retry on next mount/refetch.
      } finally {
        isSyncingRef.current = false;
      }
    }

    sync();
  }, [
    riskLevel,
    resultCount,
    hasRoutineReminder,
    duplicateCount,
  ]);
}
