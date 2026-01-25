/**
 * Lab Name Normalizer Utility
 *
 * Provides flexible matching for Canadian laboratory names by normalizing
 * variations in lab names (e.g., "Public Health Ontario Laboratory", "PHO")
 * to match against a known list of recognized Canadian labs.
 *
 * This utility solves the problem where LLM-extracted lab names contain
 * variations that don't match exact substring comparisons.
 */

/**
 * Recognized Canadian laboratory names (normalized form)
 * These are the canonical names used for matching
 */
const CANADIAN_LABS = [
  'lifelabs',
  'public health ontario',
  'dynacare',
  'bc cdc',
  'alberta precision labs',
  'gamma-dynacare',
  'medlabs',
  'bio-test',
  'idexx',
  'hassle free clinic',
  'mapletree medical',
] as const;

/**
 * Common laboratory name abbreviations mapped to their full normalized names
 * Handles cases where LLM returns abbreviated forms
 */
const LAB_ABBREVIATIONS: Record<string, string> = {
  'pho': 'public health ontario',
  'apl': 'alberta precision labs',
  'bccdc': 'bc cdc',
  'hfc': 'hassle free clinic',
};

/**
 * Common suffixes to remove during normalization
 * These are typical institutional suffixes that don't affect lab identification
 * Order matters: longer/more specific suffixes come first
 */
const LAB_SUFFIXES = [
  'medical laboratory',
  'medical laboratories',
  'medical lab',
  'laboratories',
  'laboratory',
  'lab',
  'incorporated',
  'inc',
  'limited',
  'ltd',
] as const;

/**
 * Normalizes a laboratory name for consistent matching.
 *
 * Normalization process:
 * 1. Converts to lowercase for case-insensitive matching
 * 2. Trims leading/trailing whitespace and collapses multiple spaces
 * 3. Converts "laboratories" suffix to "labs" (preserves semantic meaning)
 * 4. Removes common laboratory suffixes (laboratory, medical lab, inc, etc.)
 * 5. Expands common abbreviations to full names (PHO → public health ontario)
 *
 * @param labName - The laboratory name to normalize (can be empty or whitespace)
 * @returns Normalized laboratory name
 *
 * @example
 * normalizeLabName('Public Health Ontario Laboratory')
 * // returns 'public health ontario'
 *
 * @example
 * normalizeLabName('LifeLabs Medical Laboratory')
 * // returns 'lifelabs'
 *
 * @example
 * normalizeLabName('Alberta Precision Laboratories')
 * // returns 'alberta precision labs'
 *
 * @example
 * normalizeLabName('PHO')
 * // returns 'public health ontario'
 *
 * @example
 * normalizeLabName('  DYNACARE   Medical   Lab  ')
 * // returns 'dynacare'
 */
export function normalizeLabName(labName: string): string {
  if (!labName) return '';

  // Step 1: Convert to lowercase and trim
  let normalized = labName.toLowerCase().trim();

  // Step 2: Collapse multiple spaces to single space (do this early)
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Step 3: Handle "laboratories" → "labs" conversion before removing other suffixes
  // This ensures "Alberta Precision Laboratories" → "alberta precision labs" not "alberta precision"
  normalized = normalized.replace(/\s+laboratories\s*$/i, ' labs').trim();

  // Step 4: Remove common suffixes iteratively (handles multiple suffixes like "Medical Laboratory Inc")
  let prevNormalized = '';
  while (prevNormalized !== normalized) {
    prevNormalized = normalized;
    for (const suffix of LAB_SUFFIXES) {
      // Skip "laboratories" as we already handled it
      if (suffix === 'laboratories') continue;
      const pattern = new RegExp(`\\s+${suffix}\\s*$`, 'i');
      normalized = normalized.replace(pattern, '').trim();
    }
  }

  // Step 5: Expand abbreviations to full names (after suffix removal)
  if (LAB_ABBREVIATIONS[normalized]) {
    normalized = LAB_ABBREVIATIONS[normalized];
  }

  return normalized;
}

/**
 * Checks if a laboratory name matches any recognized Canadian laboratory.
 *
 * Uses flexible matching that handles:
 * - Name variations (e.g., "Public Health Ontario Laboratory" vs "public health ontario")
 * - Abbreviations (e.g., "PHO" matches "public health ontario")
 * - Extra whitespace and case differences
 * - Common suffixes (e.g., "Laboratory", "Medical Lab")
 *
 * Matching strategy:
 * - Normalizes the input lab name
 * - Checks if any recognized Canadian lab name is contained within the normalized input
 * - Returns true on first match (short-circuit evaluation for performance)
 *
 * @param labName - The laboratory name to check (from LLM or other source)
 * @returns true if the lab name matches a recognized Canadian laboratory, false otherwise
 *
 * @example
 * matchesCanadianLab('Public Health Ontario Laboratory')
 * // returns true
 *
 * @example
 * matchesCanadianLab('PHO')
 * // returns true
 *
 * @example
 * matchesCanadianLab('LifeLabs Medical Laboratory')
 * // returns true
 *
 * @example
 * matchesCanadianLab('lifelabs')
 * // returns true
 *
 * @example
 * matchesCanadianLab('  DYNACARE   Medical   Lab  ')
 * // returns true
 *
 * @example
 * matchesCanadianLab('Unknown Lab Inc')
 * // returns false
 *
 * @example
 * matchesCanadianLab('')
 * // returns false
 */
export function matchesCanadianLab(labName: string): boolean {
  if (!labName) return false;

  const normalized = normalizeLabName(labName);
  if (!normalized) return false;

  // Strategy 1: Check if any Canadian lab name is contained in the normalized input
  // Using .some() for short-circuit evaluation (stops on first match)
  const hasMatch = CANADIAN_LABS.some(lab => normalized.includes(lab));
  if (hasMatch) return true;

  // Strategy 2: Check with spaces and hyphens removed to handle variations like:
  // - "Life Labs" vs "LifeLabs"
  // - "Life-Labs" vs "LifeLabs"
  // - "Alberta Precision Laboratories" vs "alberta precision labs"
  const normalizedNoSpaces = normalized.replace(/[\s-]+/g, '');
  const foundMatch = CANADIAN_LABS.some(lab => {
    const labNoSpaces = lab.replace(/[\s-]+/g, '');
    // Only match if normalized input contains the full lab name (not vice versa)
    // This prevents "life" from matching "lifelabs"
    return normalizedNoSpaces.includes(labNoSpaces);
  });
  if (foundMatch) return true;

  // Strategy 3: Check if the normalized name (with suffixes removed) starts with a Canadian lab
  // This handles cases like "Mapletree Medical Laboratory" where "Medical Laboratory" is removed
  // leaving "mapletree", which should still match "mapletree medical"
  return CANADIAN_LABS.some(lab => {
    const labWords = lab.split(/[\s-]+/).filter(w => w.length > 0);
    const normalizedWords = normalized.split(/[\s-]+/).filter(w => w.length > 0);

    if (normalizedWords.length === 0) return false;

    // For single word matches, require a longer word or exact match
    if (normalizedWords.length === 1) {
      const word = normalizedWords[0];
      // Reject short single words like "Life", "Labs", "Health", "Ontario"
      if (word.length < 6) return false;
      // Single long word must be in the lab name
      return lab.includes(word);
    }

    // For multi-word matches, require:
    // 1. All normalized words appear in the lab name
    // 2. Sufficient overlap - normalized must have at least 80% of lab's words
    //    This prevents "health ontario" (2 words) matching "public health ontario" (3 words)
    //    because 2/3 = 66% < 80%
    const allNormalizedWordsInLab = normalizedWords.every(word => lab.includes(word));
    const labWordsInNormalized = labWords.filter(word => normalizedWords.includes(word));
    const overlapRatio = labWordsInNormalized.length / labWords.length;
    const sufficientOverlap = overlapRatio >= 0.8;

    return allNormalizedWordsInLab && sufficientOverlap;
  });
}
