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
  // HSV methods
  { id: "daily_antivirals", label: "Daily antivirals", applicableTo: ["HSV-1", "HSV-2"] },
  { id: "antiviral_as_needed", label: "Antivirals as needed", applicableTo: ["HSV-1", "HSV-2"] },
  { id: "supplements", label: "Supplements", applicableTo: ["HSV-1", "HSV-2"] },

  // HIV methods
  { id: "prep", label: "PrEP", applicableTo: ["HIV"] },
  { id: "art_treatment", label: "ART treatment", applicableTo: ["HIV"] },
  { id: "undetectable", label: "Undetectable viral load", applicableTo: ["HIV"] },

  // Hepatitis B + C shared methods
  { id: "antiviral_treatment", label: "Antiviral treatment", applicableTo: ["Hepatitis B", "Hepatitis C"] },
  { id: "liver_monitoring", label: "Liver function monitoring", applicableTo: ["Hepatitis B", "Hepatitis C"] },

  // Hepatitis B + HPV shared
  { id: "vaccinated", label: "Vaccinated", applicableTo: ["Hepatitis B", "HPV"] },

  // Hepatitis C specific
  { id: "cured", label: "Completed treatment / cured", applicableTo: ["Hepatitis C"] },

  // HPV specific
  { id: "regular_screening", label: "Regular screening", applicableTo: ["HPV"] },

  // Universal methods
  { id: "barriers", label: "Barrier use", applicableTo: ["all"] },
  { id: "regular_monitoring", label: "Regular monitoring", applicableTo: ["all"] },
];

/**
 * Regex patterns for flexible condition name matching.
 * Keys correspond to the applicableTo values used in MANAGEMENT_METHODS.
 */
const CONDITION_PATTERNS: Record<string, RegExp> = {
  "HSV-1": /hsv[-\s]?1|herpes\s*simplex\s*(virus\s*)?1|oral\s*herpes/i,
  "HSV-2": /hsv[-\s]?2|herpes\s*simplex\s*(virus\s*)?2|genital\s*herpes/i,
  "HIV": /hiv|human\s*immunodeficiency/i,
  "Hepatitis B": /hep(atitis)?\s*b|hbv/i,
  "Hepatitis C": /hep(atitis)?\s*c|hcv/i,
  "HPV": /hpv|human\s*papilloma/i,
};

/**
 * Returns management methods applicable to a given condition.
 * Uses regex patterns for flexible matching of condition name variations.
 */
export function getMethodsForCondition(condition: string): ManagementMethod[] {
  return MANAGEMENT_METHODS.filter((method) =>
    method.applicableTo.some((pattern) => {
      if (pattern === "all") return true;
      const regex = CONDITION_PATTERNS[pattern];
      if (regex) return regex.test(condition);
      // Fallback: simple case-insensitive includes
      return condition.toLowerCase().includes(pattern.toLowerCase());
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
