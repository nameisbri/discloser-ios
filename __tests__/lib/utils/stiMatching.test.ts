/**
 * STI Matching Tests
 *
 * Tests the matching of STI names against known conditions.
 */

interface KnownCondition {
  condition: string;
  added_at: string;
  notes?: string;
}

function matchesKnownCondition(stiName: string, knownConditions: KnownCondition[]): boolean {
  const name = stiName.toLowerCase();

  return knownConditions.some((kc) => {
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

    return false;
  });
}

// Helper to create known condition
function kc(condition: string, notes?: string): KnownCondition {
  return { condition, added_at: new Date().toISOString(), notes };
}

// ============================================
// TESTS
// ============================================

describe('matchesKnownCondition', () => {
  describe('Direct Matching', () => {
    test('matches exact condition name', () => {
      const conditions = [kc('HIV-1/2')];
      expect(matchesKnownCondition('hiv-1/2', conditions)).toBe(true);
    });

    test('case insensitive matching', () => {
      const conditions = [kc('HIV')];
      expect(matchesKnownCondition('HIV', conditions)).toBe(true);
      expect(matchesKnownCondition('hiv', conditions)).toBe(true);
      expect(matchesKnownCondition('Hiv', conditions)).toBe(true);
    });
  });

  describe('HSV-1 Matching', () => {
    test('matches HSV-1 with various test name formats', () => {
      const conditions = [kc('Herpes (HSV-1)')];

      expect(matchesKnownCondition('HSV-1', conditions)).toBe(true);
      expect(matchesKnownCondition('hsv-1', conditions)).toBe(true);
      expect(matchesKnownCondition('HSV1', conditions)).toBe(true);
      expect(matchesKnownCondition('Herpes Simplex Virus 1', conditions)).toBe(true);
      expect(matchesKnownCondition('Simplex 1 IGG', conditions)).toBe(true);
    });

    test('does NOT match HSV-2 when condition is HSV-1', () => {
      const conditions = [kc('Herpes (HSV-1)')];

      expect(matchesKnownCondition('HSV-2', conditions)).toBe(false);
      expect(matchesKnownCondition('Herpes Simplex Virus 2', conditions)).toBe(false);
    });
  });

  describe('HSV-2 Matching', () => {
    test('matches HSV-2 with various test name formats', () => {
      const conditions = [kc('Herpes (HSV-2)')];

      expect(matchesKnownCondition('HSV-2', conditions)).toBe(true);
      expect(matchesKnownCondition('hsv-2', conditions)).toBe(true);
      expect(matchesKnownCondition('HSV2', conditions)).toBe(true);
      expect(matchesKnownCondition('Herpes Simplex Virus 2', conditions)).toBe(true);
      expect(matchesKnownCondition('Simplex 2 IGG', conditions)).toBe(true);
    });

    test('does NOT match HSV-1 when condition is HSV-2', () => {
      const conditions = [kc('Herpes (HSV-2)')];

      expect(matchesKnownCondition('HSV-1', conditions)).toBe(false);
      expect(matchesKnownCondition('Herpes Simplex Virus 1', conditions)).toBe(false);
    });
  });

  describe('HIV Matching', () => {
    test('matches HIV with various test name formats', () => {
      const conditions = [kc('HIV-1/2')];

      expect(matchesKnownCondition('HIV', conditions)).toBe(true);
      expect(matchesKnownCondition('HIV-1', conditions)).toBe(true);
      expect(matchesKnownCondition('HIV-2', conditions)).toBe(true);
      expect(matchesKnownCondition('HIV-1/2', conditions)).toBe(true);
      expect(matchesKnownCondition('HIV Antibody', conditions)).toBe(true);
    });
  });

  describe('Hepatitis B Matching', () => {
    test('matches Hepatitis B with various formats', () => {
      const conditions = [kc('Hepatitis B')];

      expect(matchesKnownCondition('Hepatitis B', conditions)).toBe(true);
      expect(matchesKnownCondition('hepatitis b', conditions)).toBe(true);
      expect(matchesKnownCondition('Hep B', conditions)).toBe(true);
      expect(matchesKnownCondition('HBV', conditions)).toBe(true);
      expect(matchesKnownCondition('Hepatitis B Surface Antigen', conditions)).toBe(true);
    });

    test('matches when condition uses abbreviation', () => {
      const conditions = [kc('HBV')];

      expect(matchesKnownCondition('Hepatitis B', conditions)).toBe(true);
      expect(matchesKnownCondition('Hep B', conditions)).toBe(true);
      expect(matchesKnownCondition('HBV', conditions)).toBe(true);
    });

    test('does NOT match Hepatitis C when condition is Hepatitis B', () => {
      const conditions = [kc('Hepatitis B')];

      expect(matchesKnownCondition('Hepatitis C', conditions)).toBe(false);
      expect(matchesKnownCondition('HCV', conditions)).toBe(false);
    });
  });

  describe('Hepatitis C Matching', () => {
    test('matches Hepatitis C with various formats', () => {
      const conditions = [kc('Hepatitis C')];

      expect(matchesKnownCondition('Hepatitis C', conditions)).toBe(true);
      expect(matchesKnownCondition('hepatitis c', conditions)).toBe(true);
      expect(matchesKnownCondition('Hep C', conditions)).toBe(true);
      expect(matchesKnownCondition('HCV', conditions)).toBe(true);
      expect(matchesKnownCondition('Hepatitis C Antibody', conditions)).toBe(true);
    });

    test('does NOT match Hepatitis B when condition is Hepatitis C', () => {
      const conditions = [kc('Hepatitis C')];

      expect(matchesKnownCondition('Hepatitis B', conditions)).toBe(false);
      expect(matchesKnownCondition('HBV', conditions)).toBe(false);
    });
  });

  describe('Multiple Conditions', () => {
    test('matches any of multiple conditions', () => {
      const conditions = [
        kc('HIV-1/2'),
        kc('Herpes (HSV-2)'),
      ];

      expect(matchesKnownCondition('HIV', conditions)).toBe(true);
      expect(matchesKnownCondition('HSV-2', conditions)).toBe(true);
      expect(matchesKnownCondition('HSV-1', conditions)).toBe(false);
    });

    test('matches all chronic conditions', () => {
      const conditions = [
        kc('HIV-1/2'),
        kc('Herpes (HSV-1)'),
        kc('Herpes (HSV-2)'),
        kc('Hepatitis B'),
        kc('Hepatitis C'),
      ];

      expect(matchesKnownCondition('HIV', conditions)).toBe(true);
      expect(matchesKnownCondition('HSV-1', conditions)).toBe(true);
      expect(matchesKnownCondition('HSV-2', conditions)).toBe(true);
      expect(matchesKnownCondition('Hepatitis B', conditions)).toBe(true);
      expect(matchesKnownCondition('Hepatitis C', conditions)).toBe(true);
    });
  });

  describe('Non-Matching Cases', () => {
    test('does NOT match curable STIs', () => {
      const conditions = [kc('HIV-1/2')];

      expect(matchesKnownCondition('Chlamydia', conditions)).toBe(false);
      expect(matchesKnownCondition('Gonorrhea', conditions)).toBe(false);
      expect(matchesKnownCondition('Syphilis', conditions)).toBe(false);
    });

    test('does NOT match when no conditions', () => {
      expect(matchesKnownCondition('HIV', [])).toBe(false);
      expect(matchesKnownCondition('HSV-1', [])).toBe(false);
    });

    test('does NOT match unrelated conditions', () => {
      const conditions = [kc('Hepatitis B')];

      expect(matchesKnownCondition('HIV', conditions)).toBe(false);
      expect(matchesKnownCondition('HSV-1', conditions)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty STI name', () => {
      const conditions = [kc('HIV-1/2')];
      expect(matchesKnownCondition('', conditions)).toBe(false);
    });

    test('handles condition with notes', () => {
      const conditions = [kc('HIV-1/2', 'Diagnosed 2020, on treatment')];
      expect(matchesKnownCondition('HIV', conditions)).toBe(true);
    });

    test('handles whitespace in names', () => {
      const conditions = [kc('  HIV-1/2  ')];
      expect(matchesKnownCondition('hiv', conditions)).toBe(true);
    });
  });
});
