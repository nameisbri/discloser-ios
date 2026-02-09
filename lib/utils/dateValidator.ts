/**
 * Date validation utilities for collection dates extracted from medical lab
 * documents by an LLM. Feeds into the verification scoring system.
 *
 * All comparisons use UTC to avoid timezone-related inconsistencies.
 */

/** Threshold in days beyond which a collection date is considered old. */
const MAX_AGE_DAYS = 730;

/** Threshold in milliseconds below which the gap between collection and upload is suspicious. */
const SUSPICIOUS_GAP_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Result of validating an LLM-extracted collection date. */
export interface DateValidationResult {
  /** Whether the date is considered acceptable for downstream use. */
  isValid: boolean;
  /** True when the parsed date is after the reference timestamp. */
  isFuture: boolean;
  /** True when the parsed date is more than 2 years before the reference timestamp. */
  isOlderThan2Years: boolean;
  /** True when the gap between collection date and upload timestamp is less than 2 hours. */
  isSuspiciouslyFast: boolean;
  /** The successfully parsed Date, or null if parsing failed. */
  parsedDate: Date | null;
  /** Human-readable explanation of the validation outcome. */
  details: string;
}

/**
 * Build a {@link DateValidationResult} with sensible defaults.
 * Only the provided overrides are applied; every flag defaults to `false` and
 * `parsedDate` defaults to `null`.
 */
function buildResult(overrides: Partial<DateValidationResult>): DateValidationResult {
  return {
    isValid: false,
    isFuture: false,
    isOlderThan2Years: false,
    isSuspiciouslyFast: false,
    parsedDate: null,
    details: '',
    ...overrides,
  };
}

/**
 * Attempt to parse a date string as UTC.
 *
 * Accepted formats:
 * - `YYYY-MM-DD` (interpreted as UTC midnight)
 * - Any valid ISO 8601 string (e.g. `2024-03-15T14:30:00Z`)
 *
 * @returns A valid `Date` in UTC, or `null` when parsing fails.
 */
function parseAsUTC(dateString: string): Date | null {
  const trimmed = dateString.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // YYYY-MM-DD without time component -- anchor to UTC midnight explicitly
  // so the JS engine does not apply local-timezone offset.
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const raw = dateOnlyPattern.test(trimmed)
    ? new Date(trimmed + 'T00:00:00Z')
    : new Date(trimmed);

  if (isNaN(raw.getTime())) {
    return null;
  }

  return raw;
}

/**
 * Validate a collection date string extracted from a medical lab document.
 *
 * The function checks, in order:
 * 1. **Presence** -- `null` or empty strings are reported as missing.
 * 2. **Parsability** -- the string must be a valid `YYYY-MM-DD` or ISO 8601 date.
 * 3. **Future date** -- a collection date after the reference time is invalid.
 * 4. **Age** -- dates older than 2 years (730 days) are flagged but still valid.
 * 5. **Suspicious proximity** -- if an `uploadTimestamp` is provided and the
 *    collection date is less than 2 hours before the upload, the result is
 *    flagged but still valid.
 * 6. **Normal** -- all checks pass with no flags.
 *
 * @param dateString   The date string to validate, typically `YYYY-MM-DD`.
 *                     `null` is an expected value (the LLM may not extract a date).
 * @param uploadTimestamp  Optional reference timestamp representing when the
 *                         document was uploaded. Defaults to the current time.
 * @returns A {@link DateValidationResult} describing the outcome.
 *
 * @example
 * ```ts
 * const result = validateCollectionDate('2024-06-15');
 * if (!result.isValid) {
 *   console.warn(result.details);
 * }
 * ```
 */
export function validateCollectionDate(
  dateString: string | null,
  uploadTimestamp?: Date,
): DateValidationResult {
  // 1. Null / empty guard
  if (dateString === null || dateString.trim().length === 0) {
    return buildResult({
      isValid: false,
      details: 'No collection date provided',
    });
  }

  // 2. Parse
  const parsed = parseAsUTC(dateString);
  if (parsed === null) {
    return buildResult({
      isValid: false,
      details: `Unable to parse date string: expected YYYY-MM-DD or ISO 8601 format, received "${dateString}"`,
    });
  }

  const reference = uploadTimestamp ?? new Date();
  const diffMs = reference.getTime() - parsed.getTime();

  // 3. Future date check
  if (diffMs < 0) {
    return buildResult({
      isValid: false,
      isFuture: true,
      parsedDate: parsed,
      details: 'Collection date is in the future',
    });
  }

  // 4. Older than 2 years
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_AGE_DAYS) {
    return buildResult({
      isValid: true,
      isOlderThan2Years: true,
      parsedDate: parsed,
      details: 'Collection date is more than 2 years old',
    });
  }

  // 5. Suspiciously close to upload
  if (uploadTimestamp !== undefined && diffMs < SUSPICIOUS_GAP_MS) {
    return buildResult({
      isValid: true,
      isSuspiciouslyFast: true,
      parsedDate: parsed,
      details: 'Collection date is unusually close to upload time',
    });
  }

  // 6. Normal valid date
  return buildResult({
    isValid: true,
    parsedDate: parsed,
    details: 'Collection date is valid',
  });
}
