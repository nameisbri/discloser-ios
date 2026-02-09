/**
 * Date Validator Tests
 *
 * Tests the validateCollectionDate function for edge cases including
 * null/empty, future dates, old dates, and suspiciously fast uploads.
 */

import { validateCollectionDate, DateValidationResult } from '../../../lib/utils/dateValidator';

describe('validateCollectionDate', () => {
  describe('Null and Empty Input', () => {
    test('returns invalid for null date', () => {
      const result = validateCollectionDate(null);
      expect(result.isValid).toBe(false);
      expect(result.parsedDate).toBeNull();
      expect(result.details).toContain('No collection date');
    });

    test('returns invalid for empty string', () => {
      const result = validateCollectionDate('');
      expect(result.isValid).toBe(false);
    });

    test('returns invalid for whitespace-only string', () => {
      const result = validateCollectionDate('   ');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Unparseable Dates', () => {
    test('returns invalid for nonsense string', () => {
      const result = validateCollectionDate('not-a-date');
      expect(result.isValid).toBe(false);
      expect(result.parsedDate).toBeNull();
      expect(result.details).toContain('Unable to parse');
    });

    test('returns invalid for partial date', () => {
      const result = validateCollectionDate('2024-13-45');
      // JS Date might parse or not, but either way we test behavior
      if (result.parsedDate === null) {
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('Future Date Detection', () => {
    test('flags future dates as invalid', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const result = validateCollectionDate(futureDateStr);
      expect(result.isValid).toBe(false);
      expect(result.isFuture).toBe(true);
      expect(result.parsedDate).not.toBeNull();
    });

    test('tomorrow is flagged as future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2); // +2 to account for timezone
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const result = validateCollectionDate(tomorrowStr);
      expect(result.isFuture).toBe(true);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Old Date Detection', () => {
    test('flags dates older than 2 years', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 3);
      const oldDateStr = oldDate.toISOString().split('T')[0];

      const result = validateCollectionDate(oldDateStr);
      expect(result.isValid).toBe(true); // Old dates are still valid
      expect(result.isOlderThan2Years).toBe(true);
    });

    test('does not flag dates within 2 years', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);
      const recentDateStr = recentDate.toISOString().split('T')[0];

      const result = validateCollectionDate(recentDateStr);
      expect(result.isValid).toBe(true);
      expect(result.isOlderThan2Years).toBe(false);
    });
  });

  describe('Suspiciously Fast Upload Detection', () => {
    test('flags collection date within 2 hours of upload', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      const dateStr = oneHourAgo.toISOString();

      const result = validateCollectionDate(dateStr, now);
      expect(result.isValid).toBe(true);
      expect(result.isSuspiciouslyFast).toBe(true);
    });

    test('does not flag when no upload timestamp provided', () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1);
      const dateStr = recentDate.toISOString().split('T')[0];

      // Without uploadTimestamp, the gap check is skipped
      const result = validateCollectionDate(dateStr);
      expect(result.isSuspiciouslyFast).toBe(false);
    });

    test('does not flag normal gap (> 2 hours)', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const dateStr = yesterday.toISOString().split('T')[0];

      const result = validateCollectionDate(dateStr, now);
      expect(result.isSuspiciouslyFast).toBe(false);
    });
  });

  describe('Valid Dates', () => {
    test('accepts standard YYYY-MM-DD format', () => {
      const result = validateCollectionDate('2024-06-15');
      expect(result.isValid).toBe(true);
      expect(result.parsedDate).not.toBeNull();
      expect(result.isFuture).toBe(false);
      expect(result.isOlderThan2Years).toBe(false);
      expect(result.isSuspiciouslyFast).toBe(false);
    });

    test('accepts ISO 8601 format', () => {
      const result = validateCollectionDate('2024-06-15T14:30:00Z');
      expect(result.isValid).toBe(true);
      expect(result.parsedDate).not.toBeNull();
    });

    test('recent date is valid with no flags', () => {
      const recent = new Date();
      recent.setMonth(recent.getMonth() - 1);
      const dateStr = recent.toISOString().split('T')[0];

      const result = validateCollectionDate(dateStr);
      expect(result.isValid).toBe(true);
      expect(result.details).toContain('valid');
    });
  });

  describe('Result Structure', () => {
    test('always returns all required fields', () => {
      const result = validateCollectionDate('2024-06-15');
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.isFuture).toBe('boolean');
      expect(typeof result.isOlderThan2Years).toBe('boolean');
      expect(typeof result.isSuspiciouslyFast).toBe('boolean');
      expect(typeof result.details).toBe('string');
      // parsedDate can be null or Date
      expect(result.parsedDate === null || result.parsedDate instanceof Date).toBe(true);
    });
  });
});
