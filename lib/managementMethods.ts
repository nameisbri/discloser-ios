/**
 * Management methods for known/managed conditions.
 * Users can optionally declare HOW they manage each condition.
 * These display as pills on shared result cards.
 */

export interface ManagementMethod {
  id: string;
  label: string;
  applicableTo: string[]; // condition name patterns, or ["all"] for universal
}

export const MANAGEMENT_METHODS: ManagementMethod[] = [
  { id: "daily_antivirals", label: "Daily antivirals", applicableTo: ["HSV-1", "HSV-2"] },
  { id: "prep", label: "PrEP", applicableTo: ["HIV"] },
  { id: "art_treatment", label: "ART treatment", applicableTo: ["HIV"] },
  { id: "undetectable", label: "Undetectable viral load", applicableTo: ["HIV"] },
  { id: "barriers", label: "Barrier use", applicableTo: ["all"] },
  { id: "regular_monitoring", label: "Regular monitoring", applicableTo: ["all"] },
  { id: "supplements", label: "Supplements", applicableTo: ["HSV-1", "HSV-2"] },
  { id: "antiviral_as_needed", label: "Antivirals as needed", applicableTo: ["HSV-1", "HSV-2"] },
];

/**
 * Returns management methods applicable to a given condition.
 * Matches by checking if the condition name contains any of the applicableTo patterns.
 */
export function getMethodsForCondition(condition: string): ManagementMethod[] {
  const name = condition.toLowerCase();
  return MANAGEMENT_METHODS.filter((method) =>
    method.applicableTo.some((pattern) => {
      if (pattern === "all") return true;
      return name.includes(pattern.toLowerCase());
    })
  );
}

/**
 * Returns the display label for a management method ID.
 * Returns the ID itself if no matching method is found.
 */
export function getMethodLabel(id: string): string {
  const method = MANAGEMENT_METHODS.find((m) => m.id === id);
  return method?.label ?? id;
}
