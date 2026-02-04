import { AccessibilityInfo, AccessibilityRole } from "react-native";

/**
 * Accessibility utility functions for consistent screen reader support
 */

/**
 * Component types that map to accessibility roles
 */
export type ComponentType =
  | "button"
  | "link"
  | "image"
  | "text"
  | "header"
  | "search"
  | "switch"
  | "checkbox"
  | "radio"
  | "slider"
  | "tab"
  | "menu"
  | "alert";

/**
 * Maps component types to React Native accessibility roles
 */
const roleMap: Record<ComponentType, AccessibilityRole> = {
  button: "button",
  link: "link",
  image: "image",
  text: "text",
  header: "header",
  search: "search",
  switch: "switch",
  checkbox: "checkbox",
  radio: "radio",
  slider: "adjustable",
  tab: "tab",
  menu: "menu",
  alert: "alert",
};

/**
 * Get the appropriate accessibility role for a component type
 */
export function getAccessibilityRole(
  componentType: ComponentType
): AccessibilityRole {
  return roleMap[componentType] || "none";
}

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
 * Generate an accessibility hint describing what will happen on interaction
 *
 * @example
 * getAccessibilityHint("navigate", "settings") // "Opens settings"
 * getAccessibilityHint("toggle", "notifications") // "Toggles notifications"
 * getAccessibilityHint("delete", "result") // "Deletes this result permanently"
 */
export function getAccessibilityHint(
  action:
    | "navigate"
    | "toggle"
    | "select"
    | "delete"
    | "share"
    | "copy"
    | "submit"
    | "cancel"
    | "refresh"
    | "expand"
    | "collapse",
  target?: string
): string {
  const hintMap: Record<string, string> = {
    navigate: target ? `Opens ${target}` : "Navigates to new screen",
    toggle: target ? `Toggles ${target}` : "Toggles this option",
    select: target ? `Selects ${target}` : "Selects this option",
    delete: target
      ? `Deletes this ${target} permanently`
      : "Deletes this item permanently",
    share: target ? `Shares ${target}` : "Opens sharing options",
    copy: target ? `Copies ${target} to clipboard` : "Copies to clipboard",
    submit: target ? `Submits ${target}` : "Submits the form",
    cancel: "Cancels and goes back",
    refresh: "Refreshes the content",
    expand: target ? `Expands ${target}` : "Expands for more details",
    collapse: target ? `Collapses ${target}` : "Collapses details",
  };

  return hintMap[action] || "";
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

/**
 * Generate label for an STI result line item
 */
export function getSTIResultLabel(item: {
  name: string;
  result: string;
  isKnown?: boolean;
}): string {
  const parts = [item.name, `result: ${item.result}`];

  if (item.isKnown) {
    parts.push("known condition");
  }

  return parts.join(", ");
}
