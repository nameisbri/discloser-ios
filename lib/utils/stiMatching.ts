import type { KnownCondition } from "../types";

/**
 * Check if an STI name matches a known condition
 * Handles variations like "HSV-1", "Herpes (HSV-1)", "Herpes Simplex Virus 1"
 */
export function matchesKnownCondition(stiName: string, knownConditions: KnownCondition[]): boolean {
  return findMatchingKnownCondition(stiName, knownConditions) !== undefined;
}

/**
 * Find the matching KnownCondition entry for an STI name.
 * Returns the full KnownCondition object (including management_methods) or undefined.
 */
export function findMatchingKnownCondition(stiName: string, knownConditions: KnownCondition[]): KnownCondition | undefined {
  const name = stiName.toLowerCase();

  return knownConditions.find((kc) => {
    const cond = kc.condition.toLowerCase();

    // Direct match
    if (cond === name) return true;

    // HSV-1 variations
    if ((cond.includes('hsv-1') || cond.includes('hsv1')) &&
        (name.includes('hsv-1') || name.includes('hsv1') || name.includes('herpes simplex virus 1') || name.includes('simplex 1'))) return true;

    // HSV-2 variations
    if ((cond.includes('hsv-2') || cond.includes('hsv2')) &&
        (name.includes('hsv-2') || name.includes('hsv2') || name.includes('herpes simplex virus 2') || name.includes('simplex 2'))) return true;

    // HIV variations
    if (cond.includes('hiv') && name.includes('hiv')) return true;

    // Hepatitis B variations
    if ((cond.includes('hepatitis b') || cond.includes('hep b') || cond.includes('hbv')) &&
        (name.includes('hepatitis b') || name.includes('hep b') || name.includes('hbv'))) return true;

    // Hepatitis C variations
    if ((cond.includes('hepatitis c') || cond.includes('hep c') || cond.includes('hcv')) &&
        (name.includes('hepatitis c') || name.includes('hep c') || name.includes('hcv'))) return true;

    // HPV variations
    if ((cond.includes('hpv') || cond.includes('papilloma')) &&
        (name.includes('hpv') || name.includes('papilloma') || name.includes('human papilloma'))) return true;

    return false;
  });
}
