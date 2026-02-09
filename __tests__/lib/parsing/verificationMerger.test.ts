/**
 * Tests for verification result merging across documents in a date group.
 */

import { mergeVerificationResults } from '../../../lib/parsing/verificationMerger';
import type { VerificationResult, VerificationCheck } from '../../../lib/parsing/types';

// Helper to create a VerificationResult with given checks and flags
function makeResult(overrides: {
  checks: Array<{ name: string; points: number; maxPoints: number; passed?: boolean; details?: string }>;
  hasFutureDate?: boolean;
  isSuspiciouslyFast?: boolean;
  isOlderThan2Years?: boolean;
}): VerificationResult {
  const checks: VerificationCheck[] = overrides.checks.map((c) => ({
    name: c.name,
    passed: c.passed ?? c.points > 0,
    points: c.points,
    maxPoints: c.maxPoints,
    details: c.details,
  }));

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  const nameCheck = checks.find((c) => c.name === 'name_match');
  const nameCheckPassed = nameCheck ? nameCheck.passed : true;
  const hasFutureDate = overrides.hasFutureDate ?? false;
  const isVerified = score >= 60 && nameCheckPassed && !hasFutureDate;

  let level: 'high' | 'moderate' | 'low' | 'unverified' | 'no_signals';
  if (score >= 75) level = 'high';
  else if (score >= 50) level = 'moderate';
  else if (score >= 25) level = 'low';
  else if (score >= 1) level = 'unverified';
  else level = 'no_signals';

  return {
    score,
    level,
    checks,
    isVerified,
    hasFutureDate,
    isSuspiciouslyFast: overrides.isSuspiciouslyFast ?? false,
    isOlderThan2Years: overrides.isOlderThan2Years ?? false,
  };
}

describe('mergeVerificationResults', () => {
  it('returns undefined for empty array', () => {
    expect(mergeVerificationResults([])).toBeUndefined();
  });

  it('returns the single result unchanged for array of 1', () => {
    const result = makeResult({
      checks: [
        { name: 'recognized_lab', points: 25, maxPoints: 25 },
        { name: 'name_match', points: 15, maxPoints: 15 },
      ],
    });
    const merged = mergeVerificationResults([result]);
    expect(merged).toBe(result);
  });

  it('takes best score per check across two documents', () => {
    const docA = makeResult({
      checks: [
        { name: 'recognized_lab', points: 25, maxPoints: 25 },
        { name: 'health_card', points: 0, maxPoints: 20 },
        { name: 'accession_number', points: 0, maxPoints: 15 },
        { name: 'name_match', points: 15, maxPoints: 15 },
        { name: 'collection_date', points: 10, maxPoints: 10 },
        { name: 'structural_completeness', points: 10, maxPoints: 10 },
        { name: 'multi_signal_agreement', points: 0, maxPoints: 5 },
      ],
    });

    const docB = makeResult({
      checks: [
        { name: 'recognized_lab', points: 0, maxPoints: 25 },
        { name: 'health_card', points: 20, maxPoints: 20 },
        { name: 'accession_number', points: 15, maxPoints: 15 },
        { name: 'name_match', points: 0, maxPoints: 15, passed: false },
        { name: 'collection_date', points: 10, maxPoints: 10 },
        { name: 'structural_completeness', points: 10, maxPoints: 10 },
        { name: 'multi_signal_agreement', points: 0, maxPoints: 5 },
      ],
    });

    const merged = mergeVerificationResults([docA, docB])!;

    // Should take best from each:
    // recognized_lab: 25 (from A), health_card: 20 (from B), accession: 15 (from B),
    // name_match: 15 (from A), collection_date: 10, structural: 10, multi: 0
    expect(merged.score).toBe(95);
    expect(merged.level).toBe('high');
    expect(merged.isVerified).toBe(true);

    // Verify individual checks
    const checkMap = new Map(merged.checks.map((c) => [c.name, c]));
    expect(checkMap.get('recognized_lab')!.points).toBe(25);
    expect(checkMap.get('health_card')!.points).toBe(20);
    expect(checkMap.get('accession_number')!.points).toBe(15);
    expect(checkMap.get('name_match')!.points).toBe(15);
    expect(checkMap.get('name_match')!.passed).toBe(true);
  });

  it('combines partial signals that individually fail but together pass', () => {
    // Doc A: lab + date + structure = 45 (low)
    const docA = makeResult({
      checks: [
        { name: 'recognized_lab', points: 25, maxPoints: 25 },
        { name: 'health_card', points: 0, maxPoints: 20 },
        { name: 'accession_number', points: 0, maxPoints: 15 },
        { name: 'name_match', points: 0, maxPoints: 15, passed: false },
        { name: 'collection_date', points: 10, maxPoints: 10 },
        { name: 'structural_completeness', points: 10, maxPoints: 10 },
        { name: 'multi_signal_agreement', points: 0, maxPoints: 5 },
      ],
    });
    expect(docA.score).toBe(45);
    expect(docA.isVerified).toBe(false);

    // Doc B: name + health card = 35 (low)
    const docB = makeResult({
      checks: [
        { name: 'recognized_lab', points: 0, maxPoints: 25 },
        { name: 'health_card', points: 20, maxPoints: 20 },
        { name: 'accession_number', points: 0, maxPoints: 15 },
        { name: 'name_match', points: 15, maxPoints: 15 },
        { name: 'collection_date', points: 0, maxPoints: 10, passed: false },
        { name: 'structural_completeness', points: 0, maxPoints: 10, passed: false },
        { name: 'multi_signal_agreement', points: 0, maxPoints: 5 },
      ],
    });
    expect(docB.score).toBe(35);
    expect(docB.isVerified).toBe(false);

    // Merged: 25+20+0+15+10+10+0 = 80 (high, verified!)
    const merged = mergeVerificationResults([docA, docB])!;
    expect(merged.score).toBe(80);
    expect(merged.level).toBe('high');
    expect(merged.isVerified).toBe(true);
  });

  it('hasFutureDate from ANY document blocks verification', () => {
    const docA = makeResult({
      checks: [
        { name: 'recognized_lab', points: 25, maxPoints: 25 },
        { name: 'name_match', points: 15, maxPoints: 15 },
        { name: 'collection_date', points: 10, maxPoints: 10 },
        { name: 'structural_completeness', points: 10, maxPoints: 10 },
      ],
    });

    const docB = makeResult({
      checks: [
        { name: 'recognized_lab', points: 0, maxPoints: 25 },
        { name: 'name_match', points: 0, maxPoints: 15, passed: false },
        { name: 'collection_date', points: 0, maxPoints: 10, passed: false },
        { name: 'structural_completeness', points: 0, maxPoints: 10, passed: false },
      ],
      hasFutureDate: true,
    });

    const merged = mergeVerificationResults([docA, docB])!;
    expect(merged.hasFutureDate).toBe(true);
    expect(merged.isVerified).toBe(false);
  });

  it('isSuspiciouslyFast propagates from any document', () => {
    const docA = makeResult({
      checks: [{ name: 'recognized_lab', points: 25, maxPoints: 25 }],
      isSuspiciouslyFast: false,
    });
    const docB = makeResult({
      checks: [{ name: 'recognized_lab', points: 0, maxPoints: 25 }],
      isSuspiciouslyFast: true,
    });

    const merged = mergeVerificationResults([docA, docB])!;
    expect(merged.isSuspiciouslyFast).toBe(true);
  });

  it('isOlderThan2Years propagates from any document', () => {
    const docA = makeResult({
      checks: [{ name: 'recognized_lab', points: 25, maxPoints: 25 }],
      isOlderThan2Years: false,
    });
    const docB = makeResult({
      checks: [{ name: 'recognized_lab', points: 0, maxPoints: 25 }],
      isOlderThan2Years: true,
    });

    const merged = mergeVerificationResults([docA, docB])!;
    expect(merged.isOlderThan2Years).toBe(true);
  });

  it('preserves check order from first result', () => {
    const docA = makeResult({
      checks: [
        { name: 'recognized_lab', points: 0, maxPoints: 25 },
        { name: 'health_card', points: 0, maxPoints: 20 },
        { name: 'name_match', points: 0, maxPoints: 15, passed: false },
      ],
    });
    const docB = makeResult({
      checks: [
        { name: 'health_card', points: 20, maxPoints: 20 },
        { name: 'recognized_lab', points: 25, maxPoints: 25 },
        { name: 'name_match', points: 15, maxPoints: 15 },
      ],
    });

    const merged = mergeVerificationResults([docA, docB])!;
    expect(merged.checks.map((c) => c.name)).toEqual([
      'recognized_lab',
      'health_card',
      'name_match',
    ]);
  });

  it('handles three documents correctly', () => {
    const docA = makeResult({
      checks: [
        { name: 'recognized_lab', points: 25, maxPoints: 25 },
        { name: 'health_card', points: 0, maxPoints: 20 },
        { name: 'name_match', points: 0, maxPoints: 15, passed: false },
      ],
    });
    const docB = makeResult({
      checks: [
        { name: 'recognized_lab', points: 0, maxPoints: 25 },
        { name: 'health_card', points: 20, maxPoints: 20 },
        { name: 'name_match', points: 0, maxPoints: 15, passed: false },
      ],
    });
    const docC = makeResult({
      checks: [
        { name: 'recognized_lab', points: 0, maxPoints: 25 },
        { name: 'health_card', points: 0, maxPoints: 20 },
        { name: 'name_match', points: 15, maxPoints: 15 },
      ],
    });

    const merged = mergeVerificationResults([docA, docB, docC])!;
    // Best from each: 25 + 20 + 15 = 60
    expect(merged.score).toBe(60);
    expect(merged.level).toBe('moderate');
    expect(merged.isVerified).toBe(true);
  });

  it('accession_number takes higher of 8 vs 15 points', () => {
    const docA = makeResult({
      checks: [
        { name: 'accession_number', points: 8, maxPoints: 15, details: 'Accession present' },
      ],
    });
    const docB = makeResult({
      checks: [
        { name: 'accession_number', points: 15, maxPoints: 15, details: 'Accession matches format' },
      ],
    });

    const merged = mergeVerificationResults([docA, docB])!;
    const accCheck = merged.checks.find((c) => c.name === 'accession_number')!;
    expect(accCheck.points).toBe(15);
    expect(accCheck.details).toBe('Accession matches format');
  });
});
