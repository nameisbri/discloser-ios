/**
 * Result Standardizer Tests
 *
 * Tests the standardization of lab result text to status values.
 */

type TestStatus = 'negative' | 'positive' | 'pending' | 'inconclusive';

function standardizeResult(result: string): TestStatus {
  if (!result) return 'inconclusive';

  const cleanResult = result.toLowerCase().trim();

  // Negative patterns (no current infection)
  if (
    /^negative$|^non-reactive$|^not detected$|^absent$|no evidence|no antibodies detected|no hiv.*detected/i.test(
      cleanResult
    )
  ) {
    return 'negative';
  }

  // Immune = protected (vaccine or past infection) - treat as negative (good outcome)
  if (/^immune$|evidence of immunity|immunity/i.test(cleanResult)) {
    return 'negative';
  }

  // Positive patterns
  if (
    /^positive$|^reactive$|^detected$|antibodies detected|hiv.*detected/i.test(
      cleanResult
    )
  ) {
    return 'positive';
  }

  // Pending patterns
  if (/^pending$|referred to phl|awaiting/i.test(cleanResult)) {
    return 'pending';
  }

  // Numeric values = pending (needs review)
  if (/^\d+\.?\d*\s*[a-z/]+$/i.test(cleanResult)) {
    return 'pending';
  }

  // Indeterminate patterns
  if (/borderline|unclear|equivocal|indeterminate/i.test(cleanResult)) {
    return 'inconclusive';
  }

  // Default to inconclusive for unknown results
  return 'inconclusive';
}

// ============================================
// TESTS
// ============================================

describe('standardizeResult', () => {
  describe('Negative Results', () => {
    test('recognizes exact "negative"', () => {
      expect(standardizeResult('Negative')).toBe('negative');
      expect(standardizeResult('NEGATIVE')).toBe('negative');
      expect(standardizeResult('negative')).toBe('negative');
    });

    test('recognizes "non-reactive"', () => {
      expect(standardizeResult('Non-Reactive')).toBe('negative');
      expect(standardizeResult('NON-REACTIVE')).toBe('negative');
      expect(standardizeResult('non-reactive')).toBe('negative');
    });

    test('recognizes "not detected"', () => {
      expect(standardizeResult('Not Detected')).toBe('negative');
      expect(standardizeResult('NOT DETECTED')).toBe('negative');
    });

    test('recognizes "absent"', () => {
      expect(standardizeResult('Absent')).toBe('negative');
      expect(standardizeResult('ABSENT')).toBe('negative');
    });

    test('recognizes "no evidence" phrases', () => {
      expect(standardizeResult('No evidence of infection')).toBe('negative');
      expect(standardizeResult('No Evidence Found')).toBe('negative');
    });

    test('recognizes "no antibodies detected"', () => {
      expect(standardizeResult('No antibodies detected')).toBe('negative');
    });

    test('recognizes HIV-specific negative', () => {
      expect(standardizeResult('No HIV antibodies detected')).toBe('negative');
      expect(standardizeResult('No HIV-1/2 detected')).toBe('negative');
    });
  });

  describe('Immune Results (treated as negative)', () => {
    test('recognizes "immune"', () => {
      expect(standardizeResult('Immune')).toBe('negative');
      expect(standardizeResult('IMMUNE')).toBe('negative');
    });

    test('recognizes "evidence of immunity"', () => {
      expect(standardizeResult('Evidence of immunity')).toBe('negative');
      expect(standardizeResult('Shows evidence of immunity')).toBe('negative');
    });

    test('recognizes "immunity" phrase', () => {
      expect(standardizeResult('Has immunity')).toBe('negative');
      expect(standardizeResult('Demonstrates immunity')).toBe('negative');
    });
  });

  describe('Positive Results', () => {
    test('recognizes exact "positive"', () => {
      expect(standardizeResult('Positive')).toBe('positive');
      expect(standardizeResult('POSITIVE')).toBe('positive');
      expect(standardizeResult('positive')).toBe('positive');
    });

    test('recognizes "reactive"', () => {
      expect(standardizeResult('Reactive')).toBe('positive');
      expect(standardizeResult('REACTIVE')).toBe('positive');
    });

    test('recognizes "detected"', () => {
      expect(standardizeResult('Detected')).toBe('positive');
      expect(standardizeResult('DETECTED')).toBe('positive');
    });

    test('recognizes "antibodies detected"', () => {
      expect(standardizeResult('Antibodies Detected')).toBe('positive');
      expect(standardizeResult('IgG antibodies detected')).toBe('positive');
    });

    test('recognizes HIV-specific positive', () => {
      expect(standardizeResult('HIV detected')).toBe('positive');
      expect(standardizeResult('HIV-1 detected')).toBe('positive');
    });
  });

  describe('Pending Results', () => {
    test('recognizes "pending"', () => {
      expect(standardizeResult('Pending')).toBe('pending');
      expect(standardizeResult('PENDING')).toBe('pending');
    });

    test('recognizes "referred to PHL"', () => {
      expect(standardizeResult('Referred to PHL')).toBe('pending');
      expect(standardizeResult('Sample referred to PHL for further testing')).toBe('pending');
    });

    test('recognizes "awaiting"', () => {
      expect(standardizeResult('Awaiting results')).toBe('pending');
      expect(standardizeResult('Awaiting confirmation')).toBe('pending');
    });

    test('recognizes numeric values as pending', () => {
      expect(standardizeResult('12.5 IU/mL')).toBe('pending');
      expect(standardizeResult('0.45 S/CO')).toBe('pending');
      expect(standardizeResult('100 copies/mL')).toBe('pending');
    });
  });

  describe('Inconclusive Results', () => {
    test('recognizes "borderline"', () => {
      expect(standardizeResult('Borderline')).toBe('inconclusive');
      expect(standardizeResult('Borderline result')).toBe('inconclusive');
    });

    test('recognizes "unclear"', () => {
      expect(standardizeResult('Unclear')).toBe('inconclusive');
      expect(standardizeResult('Result unclear')).toBe('inconclusive');
    });

    test('recognizes "equivocal"', () => {
      expect(standardizeResult('Equivocal')).toBe('inconclusive');
      expect(standardizeResult('Equivocal result')).toBe('inconclusive');
    });

    test('recognizes "indeterminate"', () => {
      expect(standardizeResult('Indeterminate')).toBe('inconclusive');
      expect(standardizeResult('Indeterminate result')).toBe('inconclusive');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty string', () => {
      expect(standardizeResult('')).toBe('inconclusive');
    });

    test('handles null/undefined', () => {
      expect(standardizeResult(null as any)).toBe('inconclusive');
      expect(standardizeResult(undefined as any)).toBe('inconclusive');
    });

    test('handles whitespace', () => {
      expect(standardizeResult('  Negative  ')).toBe('negative');
      expect(standardizeResult('\tPositive\n')).toBe('positive');
    });

    test('unknown results default to inconclusive', () => {
      expect(standardizeResult('Unknown')).toBe('inconclusive');
      expect(standardizeResult('See notes')).toBe('inconclusive');
      expect(standardizeResult('N/A')).toBe('inconclusive');
      expect(standardizeResult('---')).toBe('inconclusive');
    });

    test('case insensitive matching', () => {
      expect(standardizeResult('NEGATIVE')).toBe('negative');
      expect(standardizeResult('Negative')).toBe('negative');
      expect(standardizeResult('negative')).toBe('negative');
      expect(standardizeResult('NeGaTiVe')).toBe('negative');
    });
  });

  describe('Real-World Lab Results', () => {
    test('handles LifeLabs format results', () => {
      expect(standardizeResult('Non-Reactive')).toBe('negative');
      expect(standardizeResult('Negative')).toBe('negative');
    });

    test('handles Public Health Ontario results', () => {
      expect(standardizeResult('Not Detected')).toBe('negative');
      expect(standardizeResult('Referred to PHL')).toBe('pending');
    });

    test('handles interpretation results', () => {
      expect(standardizeResult('No evidence of current or past infection')).toBe('negative');
      expect(standardizeResult('Evidence of immunity from vaccination')).toBe('negative');
    });
  });
});
