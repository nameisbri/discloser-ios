// Tests for test result deduplication logic

import { deduplicateTestResults, createDeduplicationKey } from '../../../lib/parsing/testDeduplicator';
import type { STIResult } from '../../../lib/types';

describe('createDeduplicationKey', () => {
  test('normalizes to lowercase', () => {
    expect(createDeduplicationKey('HIV-1/2')).toBe('hiv 1 2');
    expect(createDeduplicationKey('Hepatitis B')).toBe('hepatitis b');
  });

  test('normalizes separators (dash, underscore, slash)', () => {
    expect(createDeduplicationKey('HIV-1/2')).toBe('hiv 1 2');
    expect(createDeduplicationKey('HIV_1/2')).toBe('hiv 1 2');
    expect(createDeduplicationKey('HIV 1/2')).toBe('hiv 1 2');
  });

  test('collapses multiple spaces', () => {
    expect(createDeduplicationKey('Hepatitis  B')).toBe('hepatitis b');
    expect(createDeduplicationKey('HIV   1   2')).toBe('hiv 1 2');
  });

  test('trims whitespace', () => {
    expect(createDeduplicationKey('  HIV  ')).toBe('hiv');
    expect(createDeduplicationKey('\nHIV\t')).toBe('hiv');
  });

  test('handles empty strings uniquely', () => {
    const key1 = createDeduplicationKey('');
    const key2 = createDeduplicationKey('   ');
    // Empty keys should be unique (not group together)
    expect(key1).toMatch(/^__empty_/);
    expect(key2).toMatch(/^__empty_/);
    // Each empty key should be different
    expect(key1).not.toBe(key2);
  });
});

describe('deduplicateTestResults', () => {
  test('returns empty result for empty input', () => {
    const result = deduplicateTestResults([]);
    expect(result.tests).toHaveLength(0);
    expect(result.conflicts).toHaveLength(0);
    expect(result.stats.totalInput).toBe(0);
    expect(result.stats.uniqueTests).toBe(0);
  });

  test('returns single test unchanged', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests).toHaveLength(1);
    expect(result.tests[0]).toEqual(input[0]);
    expect(result.conflicts).toHaveLength(0);
    expect(result.stats.duplicatesRemoved).toBe(0);
  });

  test('keeps all unique tests', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
      { name: 'Chlamydia', result: 'Not detected', status: 'negative' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests).toHaveLength(3);
    expect(result.conflicts).toHaveLength(0);
    expect(result.stats.duplicatesRemoved).toBe(0);
  });

  test('collapses duplicates with same status', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV-1/2', result: 'Negative', status: 'negative' },
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests).toHaveLength(1);
    expect(result.conflicts).toHaveLength(0);
    expect(result.stats.duplicatesRemoved).toBe(2);
    expect(result.stats.totalInput).toBe(3);
    expect(result.stats.uniqueTests).toBe(1);
  });

  test('detects conflicts when same test has different statuses', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV-1/2', result: 'Reactive', status: 'positive' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests).toHaveLength(1);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].testName).toBe('HIV-1/2');
    expect(result.conflicts[0].occurrences).toHaveLength(2);
    expect(result.stats.conflictsDetected).toBe(1);
  });

  test('prioritizes positive status over negative (clinical safety)', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV-1/2', result: 'Reactive', status: 'positive' }
    ];
    const result = deduplicateTestResults(input);
    // Positive should be selected for clinical safety
    expect(result.tests[0].status).toBe('positive');
    expect(result.conflicts[0].suggested.status).toBe('positive');
  });

  test('prioritizes negative over pending', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Pending', status: 'pending' },
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests[0].status).toBe('negative');
  });

  test('prioritizes pending over inconclusive', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Unclear', status: 'inconclusive' },
      { name: 'HIV-1/2', result: 'Awaiting results', status: 'pending' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests[0].status).toBe('pending');
  });

  test('full priority order: positive > negative > pending > inconclusive', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Inconclusive', status: 'inconclusive' },
      { name: 'HIV-1/2', result: 'Pending', status: 'pending' },
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV-1/2', result: 'Reactive', status: 'positive' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests[0].status).toBe('positive');
  });

  test('case-insensitive test name matching', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'hiv-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests).toHaveLength(1);
    expect(result.stats.duplicatesRemoved).toBe(2);
  });

  test('handles mixed unique and duplicate tests', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
      { name: 'Chlamydia', result: 'Not detected', status: 'negative' },
      { name: 'chlamydia', result: 'Negative', status: 'negative' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests).toHaveLength(3); // HIV, Syphilis, Chlamydia
    expect(result.stats.duplicatesRemoved).toBe(2);
    expect(result.conflicts).toHaveLength(0);
  });

  test('handles multiple conflicts across different tests', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV-1/2', result: 'Reactive', status: 'positive' },
      { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
      { name: 'Syphilis', result: 'Pending', status: 'pending' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests).toHaveLength(2);
    expect(result.conflicts).toHaveLength(2);
    expect(result.stats.conflictsDetected).toBe(2);
  });

  test('prefers result with more detail when same priority', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Negative', status: 'negative' },
      { name: 'HIV-1/2', result: 'Non-reactive - No HIV antibodies detected', status: 'negative' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests[0].result).toBe('Non-reactive - No HIV antibodies detected');
  });

  test('normalizes test names with slashes', () => {
    const input: STIResult[] = [
      { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV 1/2', result: 'Negative', status: 'negative' }
    ];
    const result = deduplicateTestResults(input);
    expect(result.tests).toHaveLength(1);
    expect(result.stats.duplicatesRemoved).toBe(1);
  });

  test('stats are accurate', () => {
    const input: STIResult[] = [
      { name: 'HIV', result: 'Non-reactive', status: 'negative' },
      { name: 'HIV', result: 'Reactive', status: 'positive' }, // conflict
      { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
      { name: 'syphilis', result: 'Negative', status: 'negative' }, // duplicate
      { name: 'Chlamydia', result: 'Not detected', status: 'negative' } // unique
    ];
    const result = deduplicateTestResults(input);
    expect(result.stats.totalInput).toBe(5);
    expect(result.stats.uniqueTests).toBe(3);
    expect(result.stats.duplicatesRemoved).toBe(2); // HIV + Syphilis dups
    expect(result.stats.conflictsDetected).toBe(1); // HIV
  });
});
