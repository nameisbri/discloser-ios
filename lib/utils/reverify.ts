/**
 * Re-verifies name matching on existing test results when a user updates their profile name.
 *
 * When a user changes their first/last name in Settings, results that previously failed
 * the name_match check may now pass (or vice versa). This module re-runs name matching
 * and recalculates verification scores, levels, and isVerified for affected results.
 */

import { supabase } from '../supabase';
import { matchNames, scoreToLevel } from '../parsing/documentParser';
import type { UserProfileForVerification, VerificationCheck, VerificationLevel } from '../parsing/types';
import type { TestResult } from '../types';

interface ReverifyUpdate {
  id: string;
  verification_score: number;
  verification_level: VerificationLevel;
  verification_checks: VerificationCheck[];
  is_verified: boolean;
}

/**
 * Re-runs name matching on all of the current user's test results that have
 * verification_checks and an extracted_patient_name, then batch-updates any
 * results whose name_match outcome changed.
 *
 * @param newProfile The user's updated name
 * @returns Number of results that were updated
 */
export async function reverifyNameMatches(
  newProfile: UserProfileForVerification,
): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Fetch all results that have verification checks AND an extracted patient name
  const { data: results, error } = await supabase
    .from('test_results')
    .select('id, verification_score, verification_level, verification_checks, is_verified, extracted_patient_name')
    .eq('user_id', user.id)
    .not('verification_checks', 'is', null)
    .not('extracted_patient_name', 'is', null);

  if (error || !results || results.length === 0) return 0;

  const updates: ReverifyUpdate[] = [];

  for (const result of results as Pick<TestResult, 'id' | 'verification_score' | 'verification_level' | 'verification_checks' | 'is_verified' | 'extracted_patient_name'>[]) {
    const checks = result.verification_checks;
    if (!checks || !result.extracted_patient_name) continue;

    // Find the existing name_match check
    const nameCheckIndex = checks.findIndex((c) => c.name === 'name_match');
    if (nameCheckIndex === -1) continue;

    const oldCheck = checks[nameCheckIndex];

    // Re-run name matching with the new profile
    const newNameMatched = matchNames(result.extracted_patient_name, newProfile);

    // Skip if outcome didn't change
    if (oldCheck.passed === newNameMatched) continue;

    // Build updated checks array
    const updatedChecks = [...checks];
    updatedChecks[nameCheckIndex] = {
      ...oldCheck,
      passed: newNameMatched,
      points: newNameMatched ? oldCheck.maxPoints : 0,
      details: newNameMatched ? 'Patient name matches profile' : 'Patient name does not match profile',
    };

    // Recalculate total score
    const newScore = updatedChecks.reduce((sum, c) => sum + c.points, 0);
    const newLevel = scoreToLevel(newScore);

    // Re-evaluate hard gates: name must match (if profile provided) and no future date
    // We check the collection_date check for future date signal
    const dateCheck = updatedChecks.find((c) => c.name === 'collection_date');
    const hasFutureDate = dateCheck ? !dateCheck.passed && (dateCheck.details?.includes('future') ?? false) : false;
    const newIsVerified = newScore >= 60 && newNameMatched && !hasFutureDate;

    updates.push({
      id: result.id,
      verification_score: newScore,
      verification_level: newLevel,
      verification_checks: updatedChecks,
      is_verified: newIsVerified,
    });
  }

  if (updates.length === 0) return 0;

  // Batch update all affected results
  let updatedCount = 0;
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('test_results')
      // @ts-expect-error - Supabase types not generated, runtime types are correct
      .update({
        verification_score: update.verification_score,
        verification_level: update.verification_level,
        verification_checks: update.verification_checks,
        is_verified: update.is_verified,
      })
      .eq('id', update.id);

    if (!updateError) updatedCount++;
  }

  return updatedCount;
}
