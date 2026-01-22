/**
 * Notification Date Utility Tests
 *
 * Tests notification date parsing, conversion, and validation functions.
 */

import { parseReminderDate, getNotificationDate, isValidFutureDate } from '../../../lib/utils/notifications';

// ============================================
// TESTS: parseReminderDate
// ============================================

describe('parseReminderDate', () => {
  test('parses valid date string to 9:00 AM', () => {
    const date = parseReminderDate('2026-03-15');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2); // March is month 2 (0-indexed)
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  test('parses end-of-year date correctly', () => {
    const date = parseReminderDate('2026-12-31');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(11); // December is month 11 (0-indexed)
    expect(date.getDate()).toBe(31);
    expect(date.getHours()).toBe(9);
  });

  test('parses beginning-of-year date correctly', () => {
    const date = parseReminderDate('2026-01-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0); // January is month 0 (0-indexed)
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(9);
  });

  test('parses leap year date correctly', () => {
    const date = parseReminderDate('2024-02-29');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(1); // February
    expect(date.getDate()).toBe(29);
    expect(date.getHours()).toBe(9);
  });

  test('throws error for invalid format (MM-DD-YYYY)', () => {
    expect(() => parseReminderDate('03-15-2026')).toThrow('Invalid date format');
  });

  test('throws error for invalid format (slash separator)', () => {
    expect(() => parseReminderDate('2026/03/15')).toThrow('Invalid date format');
  });

  test('throws error for empty string', () => {
    expect(() => parseReminderDate('')).toThrow('Invalid date format');
  });

  test('throws error for non-date string', () => {
    expect(() => parseReminderDate('invalid')).toThrow('Invalid date format');
  });

  test('throws error for invalid calendar date (Feb 31)', () => {
    expect(() => parseReminderDate('2026-02-31')).toThrow('Invalid date');
  });

  test('throws error for invalid calendar date (Feb 30)', () => {
    expect(() => parseReminderDate('2026-02-30')).toThrow('Invalid date');
  });

  test('throws error for non-leap-year Feb 29', () => {
    expect(() => parseReminderDate('2023-02-29')).toThrow('Invalid date');
  });

  test('throws error for invalid month (13)', () => {
    expect(() => parseReminderDate('2026-13-01')).toThrow('Invalid month');
  });

  test('throws error for invalid month (0)', () => {
    expect(() => parseReminderDate('2026-00-15')).toThrow('Invalid month');
  });

  test('throws error for invalid day (0)', () => {
    expect(() => parseReminderDate('2026-03-00')).toThrow('Invalid day');
  });

  test('throws error for invalid day (32)', () => {
    expect(() => parseReminderDate('2026-03-32')).toThrow('Invalid day');
  });

  test('handles dates with leading zeros in month/day', () => {
    const date = parseReminderDate('2026-03-05');
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(5);
  });
});

// ============================================
// TESTS: getNotificationDate
// ============================================

describe('getNotificationDate', () => {
  test('converts string input to 9:00 AM', () => {
    const date = getNotificationDate('2026-03-15');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  test('converts Date object to 9:00 AM (from afternoon time)', () => {
    const input = new Date('2026-03-15T14:30:00');
    const date = getNotificationDate(input);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  test('converts Date object to 9:00 AM (from evening time)', () => {
    const input = new Date('2026-03-15T23:45:59');
    const date = getNotificationDate(input);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(0);
  });

  test('converts Date object to 9:00 AM (from morning time)', () => {
    const input = new Date('2026-03-15T06:15:00');
    const date = getNotificationDate(input);
    expect(date.getHours()).toBe(9);
  });

  test('converts Date object to 9:00 AM (from midnight)', () => {
    const input = new Date('2026-03-15T00:00:00');
    const date = getNotificationDate(input);
    expect(date.getHours()).toBe(9);
  });

  test('throws error for invalid string format', () => {
    expect(() => getNotificationDate('03/15/2026')).toThrow('Invalid date format');
  });

  test('throws error for number input', () => {
    // @ts-expect-error - Testing runtime error handling
    expect(() => getNotificationDate(12345)).toThrow('Invalid input type');
  });

  test('throws error for null input', () => {
    expect(() => getNotificationDate(null as any)).toThrow('Invalid input type');
  });

  test('throws error for undefined input', () => {
    expect(() => getNotificationDate(undefined as any)).toThrow('Invalid input type');
  });

  test('throws error for object input', () => {
    // @ts-expect-error - Testing runtime error handling
    expect(() => getNotificationDate({})).toThrow('Invalid input type');
  });

  test('preserves date when converting Date object', () => {
    const input = new Date(2026, 2, 15, 17, 30, 45); // March 15, 2026 at 5:30:45 PM
    const date = getNotificationDate(input);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(9);
  });
});

// ============================================
// TESTS: isValidFutureDate
// ============================================

describe('isValidFutureDate', () => {
  test('returns true for date 2 minutes in future', () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 1000);
    expect(isValidFutureDate(futureDate)).toBe(true);
  });

  test('returns true for date 1 day in future', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(isValidFutureDate(futureDate)).toBe(true);
  });

  test('returns true for date 1 week in future', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(isValidFutureDate(futureDate)).toBe(true);
  });

  test('returns true for date exactly 1 minute in future (edge case)', () => {
    const futureDate = new Date(Date.now() + 60 * 1000);
    expect(isValidFutureDate(futureDate)).toBe(true);
  });

  test('returns true for date slightly more than 1 minute in future', () => {
    const futureDate = new Date(Date.now() + 61 * 1000);
    expect(isValidFutureDate(futureDate)).toBe(true);
  });

  test('returns false for date 30 seconds in future (less than buffer)', () => {
    const almostNow = new Date(Date.now() + 30 * 1000);
    expect(isValidFutureDate(almostNow)).toBe(false);
  });

  test('returns false for date 45 seconds in future (less than buffer)', () => {
    const almostNow = new Date(Date.now() + 45 * 1000);
    expect(isValidFutureDate(almostNow)).toBe(false);
  });

  test('returns false for current time', () => {
    const now = new Date();
    expect(isValidFutureDate(now)).toBe(false);
  });

  test('returns false for date 1 minute in past', () => {
    const pastDate = new Date(Date.now() - 60 * 1000);
    expect(isValidFutureDate(pastDate)).toBe(false);
  });

  test('returns false for date 1 hour in past', () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);
    expect(isValidFutureDate(pastDate)).toBe(false);
  });

  test('returns false for date 1 day in past', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(isValidFutureDate(pastDate)).toBe(false);
  });

  test('handles far future dates correctly', () => {
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    expect(isValidFutureDate(farFuture)).toBe(true);
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('Integration: parseReminderDate + isValidFutureDate', () => {
  test('parsed future date should be valid', () => {
    // Create a date 1 week from today
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

    const parsed = parseReminderDate(dateString);
    expect(isValidFutureDate(parsed)).toBe(true);
  });

  test('parsed past date should be invalid', () => {
    // Create a date 1 week ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const dateString = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;

    const parsed = parseReminderDate(dateString);
    expect(isValidFutureDate(parsed)).toBe(false);
  });
});

describe('Integration: getNotificationDate + isValidFutureDate', () => {
  test('notification date from future string should be valid', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

    const notifDate = getNotificationDate(dateString);
    expect(isValidFutureDate(notifDate)).toBe(true);
  });

  test('notification date from Date object should maintain 9 AM time', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(15, 30, 0, 0); // 3:30 PM

    const notifDate = getNotificationDate(futureDate);
    expect(notifDate.getHours()).toBe(9);
    expect(notifDate.getMinutes()).toBe(0);
    expect(isValidFutureDate(notifDate)).toBe(true);
  });
});
