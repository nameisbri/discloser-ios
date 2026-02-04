// Test result deduplication for multi-image uploads
// Handles overlapping screenshots where the same test appears multiple times

import type { STIResult, TestStatus } from '../types';
import { logger } from '../utils/logger';

/**
 * Result of the deduplication process
 */
export interface DeduplicationResult {
  /** Unique test results after deduplication */
  tests: STIResult[];
  /** Tests with conflicting results that need user review */
  conflicts: TestConflict[];
  /** Statistics about the deduplication process */
  stats: DeduplicationStats;
}

/**
 * A test that appeared with different results across images
 */
export interface TestConflict {
  /** Normalized test name */
  testName: string;
  /** All occurrences found across images */
  occurrences: STIResult[];
  /** Suggested resolution (prioritizes clinically significant results) */
  suggested: STIResult;
}

/**
 * Statistics about the deduplication process
 */
export interface DeduplicationStats {
  /** Total tests before deduplication */
  totalInput: number;
  /** Unique tests after deduplication */
  uniqueTests: number;
  /** Number of duplicates removed */
  duplicatesRemoved: number;
  /** Number of conflicts detected */
  conflictsDetected: number;
}

/**
 * Priority for result selection when conflicts exist.
 * Higher number = higher priority.
 * Positive results should never be silently discarded (clinical safety).
 *
 * This is typed as a const to ensure exhaustive handling of all TestStatus values.
 * If a new status is added, TypeScript will error here.
 */
const STATUS_PRIORITY = {
  positive: 4,    // Most clinically significant - must not ignore
  negative: 3,    // Definitive result
  pending: 2,     // Awaiting confirmation
  inconclusive: 1 // Least reliable
} as const satisfies Record<TestStatus, number>;

/**
 * Gets the priority for a test status with safe fallback.
 * Returns 0 for unknown statuses and logs a warning.
 */
function getStatusPriority(status: TestStatus): number {
  const priority = STATUS_PRIORITY[status];
  if (priority === undefined) {
    // This should never happen if TestStatus is properly typed,
    // but we handle it defensively for runtime safety
    logger.warn('Unknown test status encountered', { status });
    return 0;
  }
  return priority;
}

/**
 * Creates a normalized key for deduplication.
 * Handles case differences, whitespace variations, and separator differences.
 *
 * Examples:
 * - "HIV-1/2" → "hiv 1 2"
 * - "hiv 1/2" → "hiv 1 2"
 * - "HIV1/2" → "hiv1 2"
 * - "Hepatitis B" → "hepatitis b"
 *
 * @param testName - The test name to normalize
 * @returns Normalized key for comparison
 */
export function createDeduplicationKey(testName: string): string {
  const normalized = testName
    .toLowerCase()
    .trim()
    .replace(/[-_\/]/g, ' ')   // Normalize separators (dash, underscore, slash)
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .trim();                    // Trim again after normalization

  // Handle empty names - ensure they don't all group together
  if (!normalized) {
    logger.warn('Empty test name encountered in deduplication', { originalName: testName });
    return `__empty_${Date.now()}_${Math.random()}__`;
  }

  return normalized;
}

/**
 * Selects the best result from multiple occurrences.
 * Prioritizes by clinical significance: positive > negative > pending > inconclusive
 *
 * @param occurrences - All occurrences of the same test
 * @returns The best result to use
 */
function selectBestResult(occurrences: STIResult[]): STIResult {
  return occurrences.reduce((best, current) => {
    const bestPriority = getStatusPriority(best.status);
    const currentPriority = getStatusPriority(current.status);

    // If same priority, prefer the one with more detail in result text
    if (currentPriority === bestPriority) {
      return current.result.length > best.result.length ? current : best;
    }

    return currentPriority > bestPriority ? current : best;
  });
}

/**
 * Deduplicates STI test results from multiple parsed images.
 *
 * When users upload multiple screenshots of the same lab report (e.g., overlapping
 * pages), the same test may appear multiple times. This function:
 * 1. Groups tests by normalized name
 * 2. Collapses duplicates with the same status
 * 3. Flags conflicts when the same test has different statuses
 *
 * @param results - Array of STI results from all parsed images
 * @returns Deduplicated results with any conflicts flagged
 */
export function deduplicateTestResults(results: STIResult[]): DeduplicationResult {
  if (results.length === 0) {
    return {
      tests: [],
      conflicts: [],
      stats: {
        totalInput: 0,
        uniqueTests: 0,
        duplicatesRemoved: 0,
        conflictsDetected: 0
      }
    };
  }

  logger.info('Starting test result deduplication', {
    inputCount: results.length
  });

  // Group by normalized test name
  const testMap = new Map<string, STIResult[]>();

  for (const result of results) {
    const key = createDeduplicationKey(result.name);
    const existing = testMap.get(key) || [];
    existing.push(result);
    testMap.set(key, existing);
  }

  const uniqueTests: STIResult[] = [];
  const conflicts: TestConflict[] = [];
  let duplicatesRemoved = 0;

  for (const [key, occurrences] of testMap.entries()) {
    if (occurrences.length === 1) {
      // No duplicates - use as-is
      uniqueTests.push(occurrences[0]);
    } else {
      // Multiple occurrences found
      const statuses = new Set(occurrences.map(o => o.status));
      duplicatesRemoved += occurrences.length - 1;

      if (statuses.size === 1) {
        // All same status - just deduplicate, keep best (most complete)
        const best = selectBestResult(occurrences);
        uniqueTests.push(best);

        logger.info('Collapsed duplicate tests with same status', {
          testName: occurrences[0].name,
          count: occurrences.length,
          status: occurrences[0].status
        });
      } else {
        // Different statuses - this is a conflict
        const suggested = selectBestResult(occurrences);

        conflicts.push({
          testName: occurrences[0].name, // Use original casing from first occurrence
          occurrences,
          suggested
        });

        // Still add suggested to results - user can override
        uniqueTests.push(suggested);

        logger.warn('Conflicting test results detected', {
          testName: occurrences[0].name,
          statuses: Array.from(statuses),
          selectedStatus: suggested.status
        });
      }
    }
  }

  const stats: DeduplicationStats = {
    totalInput: results.length,
    uniqueTests: uniqueTests.length,
    duplicatesRemoved,
    conflictsDetected: conflicts.length
  };

  logger.info('Deduplication complete', stats);

  return {
    tests: uniqueTests,
    conflicts,
    stats
  };
}
