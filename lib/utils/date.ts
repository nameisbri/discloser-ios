/**
 * Parse a YYYY-MM-DD date string into a Date object in local time.
 * Avoids the UTC timezone shift that occurs with new Date("YYYY-MM-DD").
 */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object as YYYY-MM-DD in local time.
 * Avoids the UTC shift that occurs with toISOString().split("T")[0].
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a YYYY-MM-DD date string without timezone shift
 * Use this for dates stored as YYYY-MM-DD in the database
 */
export function formatDate(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format an ISO date string (includes time/timezone)
 * Use this for full ISO timestamps
 */
export function formatISODate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
