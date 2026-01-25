/**
 * Document Parser Tests
 *
 * Tests document verification, test type determination, and name matching.
 */

import { matchesCanadianLab } from '../../../lib/utils/labNameNormalizer';

interface ParsedTest {
  name: string;
  result: string;
  status: 'negative' | 'positive' | 'pending' | 'inconclusive';
  notes?: string;
}

interface LLMResponse {
  lab_name?: string;
  patient_name?: string;
  health_card_present?: boolean;
  accession_number?: string;
  collection_date?: string;
  test_type?: string;
  tests: Array<{ name: string; result: string; notes?: string }>;
  notes?: string;
}

interface UserProfileForVerification {
  first_name: string | null;
  last_name: string | null;
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function matchNames(extractedName: string | undefined, userProfile?: UserProfileForVerification): boolean {
  if (!extractedName || !userProfile) return false;
  if (!userProfile.first_name && !userProfile.last_name) return false;

  const normalizedExtracted = normalizeName(extractedName);
  const extractedParts = normalizedExtracted.split(' ').filter(p => p.length > 0);

  const userParts: string[] = [];
  if (userProfile.first_name) {
    userParts.push(...normalizeName(userProfile.first_name).split(' '));
  }
  if (userProfile.last_name) {
    userParts.push(...normalizeName(userProfile.last_name).split(' '));
  }

  if (userParts.length === 0) return false;

  const matchedParts = userParts.filter(part =>
    extractedParts.some(extracted =>
      extracted === part || extracted.includes(part) || part.includes(extracted)
    )
  );

  const requiredMatches = Math.min(2, userParts.length);
  return matchedParts.length >= requiredMatches;
}

function verifyDocument(llm: LLMResponse, userProfile?: UserProfileForVerification) {
  const isRecognizedLab = matchesCanadianLab(llm.lab_name || '');
  const hasHealthCard = llm.health_card_present === true;
  const hasAccession = !!llm.accession_number;
  const nameMatched = matchNames(llm.patient_name, userProfile);

  const hasValidIdentifier = hasHealthCard || hasAccession;
  const nameCheckPassed = userProfile ? nameMatched : true;
  const isVerified = isRecognizedLab && hasValidIdentifier && nameCheckPassed;

  return {
    isVerified,
    details: {
      labName: llm.lab_name,
      patientName: llm.patient_name,
      hasHealthCard,
      hasAccessionNumber: hasAccession,
      nameMatched,
    },
  };
}

function determineTestType(tests: ParsedTest[]): string {
  const categories = new Set<string>();

  for (const test of tests) {
    const name = test.name.toLowerCase();
    if (name.includes('hiv')) categories.add('HIV');
    if (name.includes('hepatitis a') || name.includes('hep a') || name === 'hav') categories.add('Hepatitis A');
    if (name.includes('hepatitis b') || name.includes('hep b') || name === 'hbv') categories.add('Hepatitis B');
    if (name.includes('hepatitis c') || name.includes('hep c') || name === 'hcv') categories.add('Hepatitis C');
    if (name.includes('syphilis') || name.includes('rpr') || name.includes('vdrl')) categories.add('Syphilis');
    if (name.includes('gonorrhea') || name.includes('gc') || name.includes('neisseria')) categories.add('Gonorrhea');
    if (name.includes('chlamydia') || name.includes('ct')) categories.add('Chlamydia');
    if (name.includes('herpes') || name.includes('hsv')) categories.add('Herpes');
  }

  if (categories.size >= 4) {
    return 'Full STI Panel';
  }

  if (categories.size >= 2) {
    const cats = [...categories].slice(0, 3);
    return cats.join(' & ') + ' Panel';
  }

  if (categories.size === 1) {
    return [...categories][0] + ' Test';
  }

  return 'STI Panel';
}

function formatDocumentDate(dateString: string | null): string | null {
  if (!dateString) return null;

  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

// ============================================
// TESTS
// ============================================

describe('matchNames', () => {
  describe('Basic Matching', () => {
    test('matches exact name', () => {
      expect(matchNames('John Smith', { first_name: 'John', last_name: 'Smith' })).toBe(true);
    });

    test('matches reversed name order', () => {
      expect(matchNames('Smith John', { first_name: 'John', last_name: 'Smith' })).toBe(true);
    });

    test('case insensitive matching', () => {
      expect(matchNames('JOHN SMITH', { first_name: 'john', last_name: 'smith' })).toBe(true);
      expect(matchNames('john smith', { first_name: 'JOHN', last_name: 'SMITH' })).toBe(true);
    });

    test('matches with extra spaces', () => {
      expect(matchNames('  John   Smith  ', { first_name: 'John', last_name: 'Smith' })).toBe(true);
    });
  });

  describe('Partial Matching', () => {
    test('matches when extracted name contains user name', () => {
      expect(matchNames('Mr. John Smith Jr.', { first_name: 'John', last_name: 'Smith' })).toBe(true);
    });

    test('matches with middle names', () => {
      expect(matchNames('John Michael Smith', { first_name: 'John', last_name: 'Smith' })).toBe(true);
    });
  });

  describe('Minimum Match Requirements', () => {
    test('requires at least 2 parts to match for full names', () => {
      expect(matchNames('John Doe', { first_name: 'John', last_name: 'Smith' })).toBe(false);
    });

    test('matches with just first name if user only has first name', () => {
      expect(matchNames('John', { first_name: 'John', last_name: null })).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('returns false for empty extracted name', () => {
      expect(matchNames('', { first_name: 'John', last_name: 'Smith' })).toBe(false);
    });

    test('returns false for undefined extracted name', () => {
      expect(matchNames(undefined, { first_name: 'John', last_name: 'Smith' })).toBe(false);
    });

    test('returns false when no profile provided', () => {
      expect(matchNames('John Smith', undefined)).toBe(false);
    });

    test('returns false when profile has no names', () => {
      expect(matchNames('John Smith', { first_name: null, last_name: null })).toBe(false);
    });

    test('handles compound first names', () => {
      expect(matchNames('Mary Jane Watson', { first_name: 'Mary Jane', last_name: 'Watson' })).toBe(true);
    });
  });
});

describe('verifyDocument', () => {
  describe('Lab Recognition', () => {
    test('recognizes LifeLabs', () => {
      const result = verifyDocument({
        lab_name: 'LifeLabs Medical Laboratory',
        health_card_present: true,
        tests: [],
      });
      expect(result.isVerified).toBe(true);
    });

    test('recognizes Public Health Ontario', () => {
      const result = verifyDocument({
        lab_name: 'Public Health Ontario Laboratory',
        accession_number: 'ACC123',
        tests: [],
      });
      expect(result.isVerified).toBe(true);
    });

    test('recognizes all Canadian labs', () => {
      const labs = [
        'lifelabs', 'public health ontario', 'dynacare', 'bc cdc',
        'alberta precision labs', 'gamma-dynacare', 'medlabs',
        'bio-test', 'idexx', 'hassle free clinic', 'mapletree medical',
      ];

      for (const lab of labs) {
        const result = verifyDocument({
          lab_name: lab,
          health_card_present: true,
          tests: [],
        });
        expect(result.isVerified).toBe(true);
      }
    });

    test('rejects unrecognized labs', () => {
      const result = verifyDocument({
        lab_name: 'Unknown Lab Inc',
        health_card_present: true,
        tests: [],
      });
      expect(result.isVerified).toBe(false);
    });
  });

  describe('Identifier Requirements', () => {
    test('accepts health card as identifier', () => {
      const result = verifyDocument({
        lab_name: 'LifeLabs',
        health_card_present: true,
        tests: [],
      });
      expect(result.details.hasHealthCard).toBe(true);
      expect(result.isVerified).toBe(true);
    });

    test('accepts accession number as identifier', () => {
      const result = verifyDocument({
        lab_name: 'LifeLabs',
        accession_number: 'ACC-12345',
        tests: [],
      });
      expect(result.details.hasAccessionNumber).toBe(true);
      expect(result.isVerified).toBe(true);
    });

    test('rejects without any identifier', () => {
      const result = verifyDocument({
        lab_name: 'LifeLabs',
        health_card_present: false,
        tests: [],
      });
      expect(result.isVerified).toBe(false);
    });
  });

  describe('Name Matching with Profile', () => {
    test('verifies when name matches profile', () => {
      const result = verifyDocument(
        {
          lab_name: 'LifeLabs',
          patient_name: 'John Smith',
          health_card_present: true,
          tests: [],
        },
        { first_name: 'John', last_name: 'Smith' }
      );
      expect(result.details.nameMatched).toBe(true);
      expect(result.isVerified).toBe(true);
    });

    test('rejects when name does not match profile', () => {
      const result = verifyDocument(
        {
          lab_name: 'LifeLabs',
          patient_name: 'Jane Doe',
          health_card_present: true,
          tests: [],
        },
        { first_name: 'John', last_name: 'Smith' }
      );
      expect(result.details.nameMatched).toBe(false);
      expect(result.isVerified).toBe(false);
    });

    test('skips name check when no profile provided', () => {
      const result = verifyDocument({
        lab_name: 'LifeLabs',
        patient_name: 'Any Name',
        health_card_present: true,
        tests: [],
      });
      expect(result.isVerified).toBe(true);
    });
  });

  describe('Verification Details', () => {
    test('includes all verification details', () => {
      const result = verifyDocument({
        lab_name: 'LifeLabs',
        patient_name: 'John Smith',
        health_card_present: true,
        accession_number: 'ACC123',
        tests: [],
      });

      expect(result.details).toEqual({
        labName: 'LifeLabs',
        patientName: 'John Smith',
        hasHealthCard: true,
        hasAccessionNumber: true,
        nameMatched: false, // No profile provided
      });
    });
  });
});

describe('determineTestType', () => {
  describe('Full Panel Detection', () => {
    test('returns Full STI Panel for 4+ categories', () => {
      const tests: ParsedTest[] = [
        { name: 'HIV', result: 'Negative', status: 'negative' },
        { name: 'Syphilis', result: 'Negative', status: 'negative' },
        { name: 'Chlamydia', result: 'Negative', status: 'negative' },
        { name: 'Gonorrhea', result: 'Negative', status: 'negative' },
      ];
      expect(determineTestType(tests)).toBe('Full STI Panel');
    });

    test('returns Full STI Panel for 5+ categories', () => {
      const tests: ParsedTest[] = [
        { name: 'HIV', result: 'Negative', status: 'negative' },
        { name: 'Syphilis', result: 'Negative', status: 'negative' },
        { name: 'Chlamydia', result: 'Negative', status: 'negative' },
        { name: 'Gonorrhea', result: 'Negative', status: 'negative' },
        { name: 'Hepatitis B', result: 'Negative', status: 'negative' },
      ];
      expect(determineTestType(tests)).toBe('Full STI Panel');
    });
  });

  describe('Combined Panel Detection', () => {
    test('returns combined name for 2 categories', () => {
      const tests: ParsedTest[] = [
        { name: 'HIV', result: 'Negative', status: 'negative' },
        { name: 'Syphilis', result: 'Negative', status: 'negative' },
      ];
      const result = determineTestType(tests);
      expect(result).toContain('Panel');
      expect(result).toContain('&');
    });

    test('returns combined name for 3 categories', () => {
      const tests: ParsedTest[] = [
        { name: 'HIV', result: 'Negative', status: 'negative' },
        { name: 'Syphilis', result: 'Negative', status: 'negative' },
        { name: 'Chlamydia', result: 'Negative', status: 'negative' },
      ];
      const result = determineTestType(tests);
      expect(result).toContain('Panel');
    });
  });

  describe('Single Test Detection', () => {
    test('returns single test name for 1 category', () => {
      const tests: ParsedTest[] = [
        { name: 'HIV', result: 'Negative', status: 'negative' },
      ];
      expect(determineTestType(tests)).toBe('HIV Test');
    });

    test('identifies Syphilis test', () => {
      const tests: ParsedTest[] = [
        { name: 'RPR', result: 'Non-Reactive', status: 'negative' },
      ];
      expect(determineTestType(tests)).toBe('Syphilis Test');
    });
  });

  describe('Category Detection', () => {
    test('detects HIV variations', () => {
      expect(determineTestType([{ name: 'HIV-1/2', result: '', status: 'negative' }])).toBe('HIV Test');
      expect(determineTestType([{ name: 'hiv antibody', result: '', status: 'negative' }])).toBe('HIV Test');
    });

    test('detects Hepatitis variations', () => {
      expect(determineTestType([{ name: 'Hepatitis A', result: '', status: 'negative' }])).toBe('Hepatitis A Test');
      expect(determineTestType([{ name: 'Hepatitis B', result: '', status: 'negative' }])).toBe('Hepatitis B Test');
      expect(determineTestType([{ name: 'HBV', result: '', status: 'negative' }])).toBe('Hepatitis B Test');
      expect(determineTestType([{ name: 'HCV', result: '', status: 'negative' }])).toBe('Hepatitis C Test');
    });

    test('detects Syphilis variations', () => {
      expect(determineTestType([{ name: 'Syphilis', result: '', status: 'negative' }])).toBe('Syphilis Test');
      expect(determineTestType([{ name: 'RPR', result: '', status: 'negative' }])).toBe('Syphilis Test');
      expect(determineTestType([{ name: 'VDRL', result: '', status: 'negative' }])).toBe('Syphilis Test');
    });

    test('detects Gonorrhea variations', () => {
      expect(determineTestType([{ name: 'Gonorrhea', result: '', status: 'negative' }])).toBe('Gonorrhea Test');
      expect(determineTestType([{ name: 'GC Culture', result: '', status: 'negative' }])).toBe('Gonorrhea Test');
      expect(determineTestType([{ name: 'Neisseria', result: '', status: 'negative' }])).toBe('Gonorrhea Test');
    });

    test('detects Chlamydia variations', () => {
      expect(determineTestType([{ name: 'Chlamydia', result: '', status: 'negative' }])).toBe('Chlamydia Test');
      expect(determineTestType([{ name: 'CT Culture', result: '', status: 'negative' }])).toBe('Chlamydia Test');
    });

    test('detects Herpes variations', () => {
      expect(determineTestType([{ name: 'Herpes', result: '', status: 'negative' }])).toBe('Herpes Test');
      expect(determineTestType([{ name: 'HSV-1', result: '', status: 'negative' }])).toBe('Herpes Test');
      expect(determineTestType([{ name: 'HSV-2', result: '', status: 'negative' }])).toBe('Herpes Test');
    });
  });

  describe('Edge Cases', () => {
    test('returns STI Panel for empty tests', () => {
      expect(determineTestType([])).toBe('STI Panel');
    });

    test('returns STI Panel for unrecognized tests', () => {
      const tests: ParsedTest[] = [
        { name: 'Unknown Test', result: 'Negative', status: 'negative' },
      ];
      expect(determineTestType(tests)).toBe('STI Panel');
    });

    test('deduplicates multiple tests of same category', () => {
      const tests: ParsedTest[] = [
        { name: 'HIV-1', result: 'Negative', status: 'negative' },
        { name: 'HIV-2', result: 'Negative', status: 'negative' },
        { name: 'HIV Antibody', result: 'Negative', status: 'negative' },
      ];
      expect(determineTestType(tests)).toBe('HIV Test');
    });
  });
});

describe('formatDocumentDate', () => {
  test('returns YYYY-MM-DD as-is', () => {
    expect(formatDocumentDate('2024-01-15')).toBe('2024-01-15');
  });

  test('converts ISO date to YYYY-MM-DD', () => {
    expect(formatDocumentDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
  });

  test('handles null', () => {
    expect(formatDocumentDate(null)).toBeNull();
  });

  test('handles invalid date', () => {
    expect(formatDocumentDate('not-a-date')).toBeNull();
  });
});
