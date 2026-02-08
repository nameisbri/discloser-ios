import { AccessibilityInfo } from "react-native";

/**
 * Accessibility utility functions for consistent screen reader support
 */

/**
 * Generate a context-aware accessibility label
 * Format: "[Action/Name] [State] [Context]"
 *
 * @example
 * getAccessibilityLabel("Settings", "button") // "Settings"
 * getAccessibilityLabel("Notifications", "switch", { checked: true }) // "Notifications, on"
 * getAccessibilityLabel("HIV", "status", { status: "Negative" }) // "HIV, Negative"
 */
export function getAccessibilityLabel(
  name: string,
  context?: {
    checked?: boolean;
    selected?: boolean;
    status?: string;
    count?: number;
    date?: string;
    verified?: boolean;
  }
): string {
  const parts: string[] = [name];

  if (context) {
    // Add state information
    if (context.checked !== undefined) {
      parts.push(context.checked ? "on" : "off");
    }
    if (context.selected !== undefined && context.selected) {
      parts.push("selected");
    }
    if (context.status) {
      parts.push(context.status);
    }
    if (context.date) {
      parts.push(`from ${context.date}`);
    }
    if (context.verified) {
      parts.push("verified");
    }
    if (context.count !== undefined) {
      parts.push(`${context.count} items`);
    }
  }

  return parts.join(", ");
}

/**
 * Announce a message to screen readers
 * Useful for dynamic content updates, loading states, and action confirmations
 *
 * @example
 * announceForAccessibility("Loading test results")
 * announceForAccessibility("Result saved successfully")
 * announceForAccessibility("2 of 4 files processed")
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Generate label for a test result card
 */
export function getResultCardLabel(result: {
  test_type: string;
  test_date: string;
  overall_status: string;
  is_verified?: boolean;
}): string {
  const parts = [
    result.test_type,
    `from ${result.test_date}`,
    result.overall_status,
  ];

  if (result.is_verified) {
    parts.push("verified");
  }

  return parts.join(", ");
}

