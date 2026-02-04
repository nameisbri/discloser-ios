import React, { useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { FileText, ShieldCheck } from "lucide-react-native";
import { Card } from "./Card";
import { formatDate } from "../lib/utils/date";
import { hapticImpact } from "../lib/utils/haptics";
import { getResultCardLabel } from "../lib/utils/accessibility";
import type { TestResult } from "../lib/types";

/**
 * Props for the ResultCard component
 * All props must have stable references to ensure React.memo works correctly
 */
interface ResultCardProps {
  result: TestResult;
  index: number;
  isDark: boolean;
  hasKnownCondition: (name: string) => boolean;
}

/**
 * Status configuration type for consistent styling across all status types
 */
interface StatusConfig {
  bgLight: string;
  bgDark: string;
  text: string;
  label: string;
  icon: string;
}

/**
 * Status configurations map - extracted as constant for reusability
 * Follows Single Responsibility Principle: separate configuration from logic
 */
const getStatusConfig = (isDark: boolean): Record<string, StatusConfig> => ({
  negative: {
    bgLight: "bg-success-light",
    bgDark: "bg-dark-success-bg",
    text: isDark ? "text-dark-success" : "text-success-dark",
    label: "All Clear ✓",
    icon: isDark ? "#00E5A0" : "#10B981",
  },
  positive: {
    bgLight: "bg-danger-light",
    bgDark: "bg-dark-danger-bg",
    text: "text-danger",
    label: "Positive",
    icon: "#EF4444",
  },
  pending: {
    bgLight: "bg-warning-light",
    bgDark: "bg-dark-warning-bg",
    text: isDark ? "text-dark-warning" : "text-warning",
    label: "Pending",
    icon: "#F59E0B",
  },
  inconclusive: {
    bgLight: "bg-gray-100",
    bgDark: "bg-dark-surface-light",
    text: isDark ? "text-dark-text-secondary" : "text-gray-600",
    label: "Inconclusive",
    icon: isDark ? "#C9A0DC" : "#6B7280",
  },
  known: {
    bgLight: "bg-purple-100",
    bgDark: "bg-dark-lavender/20",
    text: isDark ? "text-dark-lavender" : "text-purple-700",
    label: "Known",
    icon: isDark ? "#C9A0DC" : "#7C3AED",
  },
});

/**
 * Determines the effective status for display purposes
 * Applies business logic: positive results with all known conditions show as "known"
 *
 * @param result - The test result to evaluate
 * @param hasKnownCondition - Function to check if a condition is known
 * @returns The effective status string for rendering
 */
const getEffectiveStatus = (
  result: TestResult,
  hasKnownCondition: (name: string) => boolean
): string => {
  // Check if all positive STIs in this result are known conditions
  const allPositivesAreKnown =
    result.sti_results?.length > 0 &&
    result.sti_results
      .filter((sti) => sti.status === "positive")
      .every((sti) => hasKnownCondition(sti.name));

  // Use "known" status if positive but all positives are known conditions
  return result.status === "positive" && allPositivesAreKnown
    ? "known"
    : result.status;
};

/**
 * ResultCard Component
 *
 * Displays a single test result card with status, date, and verification badge.
 * Optimized for scroll performance with React.memo.
 *
 * Design Patterns Applied:
 * - Memoization Pattern: Prevents unnecessary re-renders during scroll
 * - Strategy Pattern: Status configuration varies based on result type
 * - Single Responsibility: Only handles display of a single result card
 *
 * Performance Optimizations:
 * - Wrapped with React.memo with custom comparison function
 * - All expensive computations done once per render
 * - Stable references required for all props
 *
 * @param props - ResultCardProps with result data, theme, and helper function
 */
function ResultCardComponent({
  result,
  index,
  isDark,
  hasKnownCondition,
}: ResultCardProps) {
  const router = useRouter();

  // Get status configuration based on theme
  const statusConfig = getStatusConfig(isDark);

  // Determine effective status (with known condition logic)
  const effectiveStatus = getEffectiveStatus(result, hasKnownCondition);
  const status = statusConfig[effectiveStatus];

  // Handler for navigation - memoized to prevent function recreation on every render
  const handlePress = useCallback(async () => {
    await hapticImpact("light");
    router.push(`/results/${result.id}`);
  }, [router, result.id]);

  // Generate accessibility label
  const accessibilityLabel = useMemo(
    () =>
      getResultCardLabel({
        test_type: result.test_type,
        test_date: formatDate(result.test_date),
        overall_status: status.label,
        is_verified: result.is_verified,
      }),
    [result.test_type, result.test_date, result.is_verified, status.label]
  );

  return (
    <Pressable
      onPress={handlePress}
      className="active:scale-[0.98]"
      style={{ transform: [{ scale: 1 }] }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="View test result details"
    >
      <Card className="flex-row items-center">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
            isDark ? status.bgDark : status.bgLight
          }`}
        >
          <FileText size={22} color={status.icon} />
        </View>
        <View className="flex-1">
          <Text
            className={`font-inter-bold mb-1 ${
              isDark ? "text-dark-text" : "text-text"
            }`}
          >
            {result.test_type}
          </Text>
          <View className="flex-row items-center">
            <Text
              className={`text-sm font-inter-regular ${
                isDark ? "text-dark-text-secondary" : "text-text-light"
              }`}
            >
              {formatDate(result.test_date)}
            </Text>
            {result.is_verified && (
              <>
                <Text
                  className={`mx-2 ${
                    isDark ? "text-dark-text-muted" : "text-text-muted"
                  }`}
                >
                  •
                </Text>
                <ShieldCheck
                  size={14}
                  color={isDark ? "#00E5A0" : "#10B981"}
                />
              </>
            )}
          </View>
        </View>
        <View
          className={`px-3 py-1.5 rounded-full ${
            isDark ? status.bgDark : status.bgLight
          }`}
        >
          <Text className={`${status.text} font-inter-bold text-xs`}>
            {status.label}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

/**
 * Custom equality function for React.memo
 *
 * Implements shallow comparison of props to determine if re-render is needed.
 * This is critical for scroll performance with 50+ items.
 *
 * Only re-renders if:
 * - result.id changes (different result)
 * - result.status changes (status update)
 * - result.test_date changes (date update)
 * - result.is_verified changes (verification status change)
 * - isDark changes (theme switch)
 *
 * Note: We compare result properties individually rather than the whole object
 * because the result object reference may change even if content is the same.
 *
 * @param prevProps - Previous props
 * @param nextProps - Next props
 * @returns true if props are equal (skip re-render), false otherwise
 */
const arePropsEqual = (
  prevProps: ResultCardProps,
  nextProps: ResultCardProps
): boolean => {
  // Core result properties that affect rendering
  const resultEqual =
    prevProps.result.id === nextProps.result.id &&
    prevProps.result.status === nextProps.result.status &&
    prevProps.result.test_type === nextProps.result.test_type &&
    prevProps.result.test_date === nextProps.result.test_date &&
    prevProps.result.is_verified === nextProps.result.is_verified;

  // Theme property
  const themeEqual = prevProps.isDark === nextProps.isDark;

  // STI results array - compare length and individual items
  const stiResultsEqual =
    prevProps.result.sti_results?.length ===
      nextProps.result.sti_results?.length &&
    prevProps.result.sti_results?.every((sti, index) => {
      const nextSti = nextProps.result.sti_results?.[index];
      return (
        nextSti &&
        sti.name === nextSti.name &&
        sti.status === nextSti.status &&
        sti.result === nextSti.result
      );
    });

  // Function reference comparison - critical for detecting stale function references
  const functionEqual = prevProps.hasKnownCondition === nextProps.hasKnownCondition;

  // Index doesn't affect rendering, so we don't compare it

  return resultEqual && themeEqual && stiResultsEqual && functionEqual;
};

/**
 * Memoized ResultCard export
 *
 * Performance Target:
 * - <5 renders per scroll event
 * - Smooth 60fps scrolling with 50+ results
 *
 * Requirements for optimal performance:
 * 1. Parent must pass stable references (no inline objects/functions)
 * 2. hasKnownCondition must be wrapped in useCallback
 * 3. result objects should have stable references when unchanged
 */
export const ResultCard = React.memo(ResultCardComponent, arePropsEqual);
