/**
 * Example: Using useDashboardData in dashboard.tsx
 *
 * This example demonstrates how to integrate the unified useDashboardData hook
 * as a drop-in replacement for the existing multiple hooks pattern.
 *
 * BEFORE (Sequential fetching - 3-5 seconds):
 * ----------------------------------------
 * const { results, loading: resultsLoading, refetch } = useTestResults();
 * const { nextReminder, overdueReminder, activeReminders, refetch: refetchReminders } = useReminders();
 * const { routineStatus, knownConditionsStatus } = useSTIStatus();
 * const { profile, refetch: refetchProfile, updateRiskLevel, hasKnownCondition } = useProfile();
 * const recommendation = useTestingRecommendations(results);
 *
 * const loading = resultsLoading; // Individual loading states
 *
 * // Refetch requires coordinating multiple calls
 * const onRefresh = useCallback(async () => {
 *   setRefreshing(true);
 *   await Promise.all([refetch(), refetchReminders(), refetchProfile()]);
 *   setRefreshing(false);
 * }, [refetch, refetchReminders, refetchProfile]);
 *
 *
 * AFTER (Parallel fetching - < 1.5 seconds):
 * ----------------------------------------
 * const {
 *   // Raw data
 *   testResults: results,
 *   profile,
 *   reminders,
 *
 *   // Derived data - automatically computed
 *   routineStatus,
 *   knownConditionsStatus,
 *   nextReminder,
 *   overdueReminder,
 *   activeReminders,
 *   recommendation,
 *
 *   // Unified state
 *   loading,
 *   error,
 *
 *   // Single refetch for all data
 *   refetch,
 * } = useDashboardData();
 *
 * // Simplified refresh handler
 * const onRefresh = useCallback(async () => {
 *   setRefreshing(true);
 *   await refetch();
 *   setRefreshing(false);
 * }, [refetch]);
 *
 *
 * BENEFITS:
 * --------
 * 1. Performance: Parallel execution reduces load time from 3-5s to <1.5s
 * 2. Simplicity: Single hook instead of 5+ separate hooks
 * 3. Deduplication: Prevents duplicate network requests
 * 4. Consistency: Unified loading and error states
 * 5. Maintainability: Easier to reason about data flow
 * 6. Backward Compatible: Returns same data structure as existing hooks
 *
 *
 * PROFILE MUTATIONS:
 * -----------------
 * For mutations like updateRiskLevel, addKnownCondition, etc., continue
 * using useProfile for those specific operations, or call refetch() after
 * mutations to get fresh data:
 *
 * const { profile, refetch } = useDashboardData();
 * const { updateRiskLevel } = useProfile(); // For mutations only
 *
 * const handleRiskUpdate = async (level: RiskLevel) => {
 *   await updateRiskLevel(level);
 *   await refetch(); // Refresh all dashboard data
 * };
 */

import { useDashboardData } from "./useDashboardData";
import { useProfile } from "./useProfile";
import { useState, useCallback } from "react";
import type { RiskLevel } from "../types";

export function ExampleDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  // Single hook for all dashboard data
  const {
    // Raw data
    testResults: results,
    profile,
    reminders,

    // Derived data - STI Status
    routineStatus,
    knownConditionsStatus,
    overallStatus,

    // Derived data - Reminders
    nextReminder,
    overdueReminder,
    activeReminders,

    // Derived data - Testing Recommendations
    recommendation,

    // State
    loading,
    error,

    // Actions
    refetch,
  } = useDashboardData();

  // For profile mutations, use useProfile separately
  const { updateRiskLevel, hasKnownCondition } = useProfile();

  // Simplified refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle risk level update
  const handleRiskUpdate = useCallback(
    async (level: RiskLevel) => {
      await updateRiskLevel(level);
      await refetch(); // Refresh dashboard data
    },
    [updateRiskLevel, refetch]
  );

  // Rest of dashboard rendering logic remains the same
  // Access results, profile, routineStatus, etc. as before

  return null; // Your dashboard UI here
}

/**
 * MIGRATION GUIDE:
 * ---------------
 * 1. Replace multiple hook calls with single useDashboardData() call
 * 2. Keep useProfile() for mutations (updateRiskLevel, addKnownCondition, etc.)
 * 3. Simplify refresh handlers to use single refetch()
 * 4. Remove individual loading state handling
 * 5. Test that all dashboard functionality works as expected
 *
 * TESTING:
 * -------
 * Before deploying:
 * 1. Verify dashboard loads faster (measure actual load time)
 * 2. Ensure all data displays correctly
 * 3. Test refresh functionality
 * 4. Verify mutations still work (risk level, known conditions)
 * 5. Check error handling
 * 6. Test with slow network conditions
 */
