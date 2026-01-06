// Maps lab result text to standardized status

export type TestStatus = 'negative' | 'positive' | 'pending';

export function standardizeResult(result: string): TestStatus {
  if (!result) return 'pending';

  const cleanResult = result.toLowerCase().trim();

  // Negative patterns
  if (
    /^negative$|^non-reactive$|^not detected$|^absent$|no evidence|no antibodies detected|no hiv.*detected/i.test(
      cleanResult
    )
  ) {
    return 'negative';
  }

  // Evidence of immunity = negative (good)
  if (/evidence of immunity/i.test(cleanResult)) {
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

  // Numeric values = pending (needs review)
  if (/^\d+\.?\d*\s*[a-z/]+$/i.test(cleanResult)) {
    return 'pending';
  }

  // Indeterminate patterns = pending (needs review)
  if (/borderline|unclear|equivocal|indeterminate/i.test(cleanResult)) {
    return 'pending';
  }

  // Default to pending for unknown results
  return 'pending';
}
