/**
 * Notification Date Utility Module
 *
 * Centralized utility functions for handling notification dates with consistent 9 AM scheduling.
 * All functions work in local timezone to match iOS notification behavior.
 */

/**
 * Parse a YYYY-MM-DD date string and convert it to a Date object set to 9:00 AM local time.
 *
 * This ensures consistent notification scheduling at a user-friendly time.
 * Uses JavaScript Date constructor with local timezone.
 *
 * @param dateString - Date in YYYY-MM-DD format (e.g., "2026-03-15")
 * @returns Date object set to 9:00 AM local time on the specified date
 *
 * @example
 * ```ts
 * const date = parseReminderDate("2026-03-15");
 * // Returns: Date object for March 15, 2026 at 9:00 AM local time
 * ```
 *
 * @throws {Error} If dateString is not in valid YYYY-MM-DD format
 *
 * Test Cases:
 * - Valid date "2026-03-15" should return Date with hour = 9, minute = 0, second = 0
 * - Valid date "2026-12-31" should return Date with hour = 9, minute = 0, second = 0
 * - Invalid format "03-15-2026" should throw Error
 * - Invalid format "2026/03/15" should throw Error
 * - Empty string "" should throw Error
 * - Non-date string "invalid" should throw Error
 */
export function parseReminderDate(dateString: string): Date {
  // Validate format using regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new Error(`Invalid date format: "${dateString}". Expected YYYY-MM-DD format.`);
  }

  // Parse components
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Validate date components
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date components in: "${dateString}"`);
  }

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
  }

  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}. Must be between 1 and 31.`);
  }

  // Create Date at 9:00 AM local time
  // Note: JavaScript months are 0-indexed (January = 0)
  const date = new Date(year, month - 1, day, 9, 0, 0, 0);

  // Validate the date is actually valid (e.g., not Feb 31)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date: "${dateString}" does not represent a valid calendar date.`);
  }

  return date;
}

/**
 * Convert either a date string or Date object to a Date object set to 9:00 AM local time.
 *
 * Handles both string inputs (YYYY-MM-DD format) and Date objects.
 * If a Date object is provided, extracts the date components and resets to 9:00 AM.
 * This ensures consistent notification times regardless of input format.
 *
 * @param input - Either a YYYY-MM-DD string or a Date object
 * @returns Date object set to 9:00 AM local time
 *
 * @example
 * ```ts
 * // String input
 * const date1 = getNotificationDate("2026-03-15");
 * // Returns: Date object for March 15, 2026 at 9:00 AM
 *
 * // Date object input
 * const existingDate = new Date("2026-03-15T14:30:00");
 * const date2 = getNotificationDate(existingDate);
 * // Returns: Date object for March 15, 2026 at 9:00 AM (time reset to 9 AM)
 * ```
 *
 * @throws {Error} If input is neither a string nor a Date object
 * @throws {Error} If string input is not in valid YYYY-MM-DD format
 *
 * Test Cases:
 * - String "2026-03-15" should return Date at 9:00 AM
 * - Date object with time 14:30 should return same date at 9:00 AM
 * - Date object with time 23:45 should return same date at 9:00 AM
 * - Invalid string format should throw Error
 * - null input should throw Error
 * - undefined input should throw Error
 * - Number input should throw Error
 */
export function getNotificationDate(input: string | Date): Date {
  if (typeof input === 'string') {
    return parseReminderDate(input);
  }

  if (input instanceof Date) {
    // Extract date components and create new Date at 9:00 AM
    const year = input.getFullYear();
    const month = input.getMonth();
    const day = input.getDate();
    return new Date(year, month, day, 9, 0, 0, 0);
  }

  throw new Error(`Invalid input type: expected string or Date, got ${typeof input}`);
}

/**
 * Validate that a date is in the future (at least 1 minute from now).
 *
 * Ensures the notification date is schedulable by checking it's at least
 * 1 minute in the future. This buffer prevents edge cases where a notification
 * might be scheduled in the past due to processing time.
 *
 * @param date - The date to validate
 * @returns true if the date is at least 1 minute in the future, false otherwise
 *
 * @example
 * ```ts
 * const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
 * isValidFutureDate(futureDate); // true
 *
 * const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
 * isValidFutureDate(pastDate); // false
 *
 * const almostNow = new Date(Date.now() + 30 * 1000); // 30 seconds from now
 * isValidFutureDate(almostNow); // false (less than 1 minute buffer)
 * ```
 *
 * Test Cases:
 * - Date 2 minutes in future should return true
 * - Date 1 day in future should return true
 * - Date 1 minute in future should return true (edge case)
 * - Date 30 seconds in future should return false (less than buffer)
 * - Date 1 minute in past should return false
 * - Current time should return false
 */
export function isValidFutureDate(date: Date): boolean {
  // Calculate 1 minute from now in milliseconds
  const oneMinuteFromNow = Date.now() + 60 * 1000;

  // Check if date is at least 1 minute in the future
  return date.getTime() >= oneMinuteFromNow;
}
