// Maps lab result text to standardized status

export type TestStatus = 'negative' | 'positive' | 'pending' | 'inconclusive';

export function standardizeResult(result: string): TestStatus {
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
