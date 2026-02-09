/**
 * Merges verification results across multiple documents in a date group.
 *
 * When a user uploads multiple pages/files for the same test date, each
 * document is independently scored. This module combines those scores by
 * taking the best result per check across all documents, which better
 * reflects the total verification evidence available.
 *
 * Example: Doc A has the lab name (25 pts) and Doc B has the accession
 * number (15 pts). Individually each scores partial, but merged they
 * contribute both signals.
 */

import type { VerificationResult, VerificationCheck, VerificationLevel } from './types';

/**
 * Maps a numeric verification score to a level label.
 * Duplicated from documentParser to avoid circular imports via transitive deps.
 */
function scoreToLevel(score: number): VerificationLevel {
  if (score >= 75) return 'high';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'low';
  if (score >= 1) return 'unverified';
  return 'no_signals';
}

/**
 * Merges an array of VerificationResults into a single result by taking
 * the best (highest-scoring) check for each check name across all documents.
 *
 * Hard gates are combined conservatively:
 * - `hasFutureDate`: true if ANY document has a future date
 * - `isSuspiciouslyFast`: true if ANY document is suspiciously fast
 * - `isOlderThan2Years`: true if ANY document is older than 2 years
 * - `nameMatched` (for isVerified gate): true if ANY document's name_match passed
 *
 * @param results Array of VerificationResults from documents in the same date group
 * @returns A single merged VerificationResult, or undefined if input is empty
 */
export function mergeVerificationResults(
  results: VerificationResult[],
): VerificationResult | undefined {
  if (results.length === 0) return undefined;
  if (results.length === 1) return results[0];

  // Collect all checks by name, keeping the best-scoring one per check
  const bestChecks = new Map<string, VerificationCheck>();

  for (const result of results) {
    for (const check of result.checks) {
      const existing = bestChecks.get(check.name);
      if (!existing || check.points > existing.points) {
        bestChecks.set(check.name, { ...check });
      }
    }
  }

  // Preserve the original check order from the first result
  const checkOrder = results[0].checks.map((c) => c.name);
  const mergedChecks: VerificationCheck[] = [];

  for (const name of checkOrder) {
    const check = bestChecks.get(name);
    if (check) {
      mergedChecks.push(check);
      bestChecks.delete(name);
    }
  }

  // Add any checks that only appeared in later results (shouldn't happen, but safe)
  for (const check of bestChecks.values()) {
    mergedChecks.push(check);
  }

  // Recalculate total score
  const score = mergedChecks.reduce((sum, c) => sum + c.points, 0);
  const level = scoreToLevel(score);

  // Combine hard gates conservatively
  const hasFutureDate = results.some((r) => r.hasFutureDate);
  const isSuspiciouslyFast = results.some((r) => r.isSuspiciouslyFast);
  const isOlderThan2Years = results.some((r) => r.isOlderThan2Years);

  // Name match gate: verified if ANY document passed name_match
  const nameMatchCheck = mergedChecks.find((c) => c.name === 'name_match');
  const nameCheckPassed = nameMatchCheck ? nameMatchCheck.passed : true;

  const isVerified = score >= 60 && nameCheckPassed && !hasFutureDate;

  return {
    score,
    level,
    checks: mergedChecks,
    isVerified,
    hasFutureDate,
    isSuspiciouslyFast,
    isOlderThan2Years,
  };
}
