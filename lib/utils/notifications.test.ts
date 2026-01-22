/**
 * Test suite for Notification Date Utility Module
 *
 * Run with: npx ts-node lib/utils/notifications.test.ts
 * Or integrate with your test framework (Jest, Vitest, etc.)
 */

import { parseReminderDate, getNotificationDate, isValidFutureDate } from './notifications';

// Test helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

function assertThrows(fn: () => void, message: string) {
  try {
    fn();
    throw new Error(`Expected function to throw: ${message}`);
  } catch (error) {
    console.log(`✓ ${message}`);
  }
}

console.log('\n=== Testing parseReminderDate ===\n');

// Test 1: Valid date should return Date at 9:00 AM
const date1 = parseReminderDate("2026-03-15");
assert(date1.getFullYear() === 2026, 'Year should be 2026');
assert(date1.getMonth() === 2, 'Month should be 2 (March, 0-indexed)');
assert(date1.getDate() === 15, 'Day should be 15');
assert(date1.getHours() === 9, 'Hour should be 9');
assert(date1.getMinutes() === 0, 'Minutes should be 0');
assert(date1.getSeconds() === 0, 'Seconds should be 0');

// Test 2: Valid date at end of year
const date2 = parseReminderDate("2026-12-31");
assert(date2.getFullYear() === 2026, 'Year should be 2026');
assert(date2.getMonth() === 11, 'Month should be 11 (December, 0-indexed)');
assert(date2.getDate() === 31, 'Day should be 31');
assert(date2.getHours() === 9, 'Hour should be 9');

// Test 3: Invalid format (MM-DD-YYYY) should throw
assertThrows(
  () => parseReminderDate("03-15-2026"),
  'Invalid format "03-15-2026" should throw'
);

// Test 4: Invalid format (slash separator) should throw
assertThrows(
  () => parseReminderDate("2026/03/15"),
  'Invalid format "2026/03/15" should throw'
);

// Test 5: Empty string should throw
assertThrows(
  () => parseReminderDate(""),
  'Empty string should throw'
);

// Test 6: Invalid date string should throw
assertThrows(
  () => parseReminderDate("invalid"),
  'Non-date string "invalid" should throw'
);

// Test 7: Invalid date (Feb 31) should throw
assertThrows(
  () => parseReminderDate("2026-02-31"),
  'Invalid date "2026-02-31" should throw'
);

// Test 8: Invalid month should throw
assertThrows(
  () => parseReminderDate("2026-13-01"),
  'Invalid month "13" should throw'
);

// Test 9: Invalid day should throw
assertThrows(
  () => parseReminderDate("2026-01-32"),
  'Invalid day "32" should throw'
);

console.log('\n=== Testing getNotificationDate ===\n');

// Test 10: String input should work
const date3 = getNotificationDate("2026-03-15");
assert(date3.getHours() === 9, 'String input should return Date at 9:00 AM');

// Test 11: Date object input with time 14:30 should reset to 9:00 AM
const existingDate1 = new Date("2026-03-15T14:30:00");
const date4 = getNotificationDate(existingDate1);
assert(date4.getFullYear() === 2026, 'Year should be preserved');
assert(date4.getMonth() === 2, 'Month should be preserved (March, 0-indexed)');
assert(date4.getDate() === 15, 'Day should be preserved');
assert(date4.getHours() === 9, 'Hour should be reset to 9');
assert(date4.getMinutes() === 0, 'Minutes should be reset to 0');

// Test 12: Date object input with time 23:45 should reset to 9:00 AM
const existingDate2 = new Date("2026-03-15T23:45:00");
const date5 = getNotificationDate(existingDate2);
assert(date5.getHours() === 9, 'Hour should be reset to 9');
assert(date5.getMinutes() === 0, 'Minutes should be reset to 0');

// Test 13: Invalid string format should throw
assertThrows(
  () => getNotificationDate("03/15/2026"),
  'Invalid string format should throw'
);

// Test 14: Invalid input type (number) should throw
assertThrows(
  // @ts-expect-error - Testing runtime error handling
  () => getNotificationDate(12345),
  'Number input should throw'
);

// Test 15: Invalid input type (null) should throw
assertThrows(
  // @ts-expect-error - Testing runtime error handling
  () => getNotificationDate(null),
  'Null input should throw'
);

console.log('\n=== Testing isValidFutureDate ===\n');

// Test 16: Date 2 minutes in future should return true
const future1 = new Date(Date.now() + 2 * 60 * 1000);
assert(isValidFutureDate(future1), 'Date 2 minutes in future should be valid');

// Test 17: Date 1 day in future should return true
const future2 = new Date(Date.now() + 24 * 60 * 60 * 1000);
assert(isValidFutureDate(future2), 'Date 1 day in future should be valid');

// Test 18: Date 1 minute in future should return true (edge case)
const future3 = new Date(Date.now() + 61 * 1000);
assert(isValidFutureDate(future3), 'Date 61 seconds in future should be valid');

// Test 19: Date 30 seconds in future should return false
const almostNow = new Date(Date.now() + 30 * 1000);
assert(!isValidFutureDate(almostNow), 'Date 30 seconds in future should be invalid (less than 1 minute buffer)');

// Test 20: Date 1 minute in past should return false
const past1 = new Date(Date.now() - 60 * 1000);
assert(!isValidFutureDate(past1), 'Date 1 minute in past should be invalid');

// Test 21: Current time should return false
const now = new Date();
assert(!isValidFutureDate(now), 'Current time should be invalid');

console.log('\n=== All tests passed! ===\n');
