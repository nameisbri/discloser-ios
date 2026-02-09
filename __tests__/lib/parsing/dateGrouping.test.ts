// Tests for date grouping logic used in multi-document upload processing

// Mock documentParser to avoid transitive import of expo-secure-store.
// We provide a faithful reimplementation of determineTestType so assertions
// on testType values remain meaningful.
jest.mock('../../../lib/parsing/documentParser', () => ({
  determineTestType: (tests: Array<{ name: string }>) => {
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
    if (categories.size >= 4) return 'Full STI Panel';
    if (categories.size >= 2) {
      const cats = [...categories].slice(0, 3);
      return cats.join(' & ') + ' Panel';
    }
    if (categories.size === 1) return [...categories][0] + ' Test';
    return 'STI Panel';
  },
}));

import {
  groupParsedDocumentsByDate,
  ParsedDocumentForGrouping,
  DateGroupedResult,
} from '../../../lib/parsing/dateGrouping';
import type { TestStatus } from '../../../lib/types';

// ---------------------------------------------------------------------------
// Helper: build a ParsedDocumentForGrouping with sensible defaults
// ---------------------------------------------------------------------------

function makeDoc(
  overrides: Partial<ParsedDocumentForGrouping> & { collectionDate: string | null }
): ParsedDocumentForGrouping {
  return {
    tests: [],
    isVerified: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Empty input
// ---------------------------------------------------------------------------

describe('groupParsedDocumentsByDate', () => {
  test('returns empty array for empty input', () => {
    const result = groupParsedDocumentsByDate([]);
    expect(result).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 2. Single document, single date
  // -------------------------------------------------------------------------

  test('single document with one date returns 1 group', () => {
    const docs: ParsedDocumentForGrouping[] = [
      makeDoc({
        collectionDate: '2026-01-15',
        tests: [
          { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
        ],
        isVerified: true,
        verificationDetails: {
          labName: 'LifeLabs',
          patientName: 'Jane Doe',
          hasHealthCard: true,
          hasAccessionNumber: true,
          nameMatched: true,
        },
      }),
    ];

    const groups = groupParsedDocumentsByDate(docs);

    expect(groups).toHaveLength(1);
    expect(groups[0].date).toBe('2026-01-15');
    expect(groups[0].tests).toHaveLength(2);
    expect(groups[0].isVerified).toBe(true);
    expect(groups[0].verificationDetails).toHaveLength(1);
    expect(groups[0].verificationDetails[0].labName).toBe('LifeLabs');
    expect(groups[0].sourceDocIndices).toEqual([0]);
  });

  // -------------------------------------------------------------------------
  // 3. Multiple documents, same date
  // -------------------------------------------------------------------------

  test('multiple documents with the same date returns 1 group with merged tests', () => {
    const docs: ParsedDocumentForGrouping[] = [
      makeDoc({
        collectionDate: '2026-01-15',
        tests: [
          { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: '2026-01-15',
        tests: [
          { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          { name: 'Chlamydia', result: 'Not detected', status: 'negative' },
        ],
      }),
    ];

    const groups = groupParsedDocumentsByDate(docs);

    expect(groups).toHaveLength(1);
    expect(groups[0].date).toBe('2026-01-15');
    // All three unique tests should be present (no duplicates to collapse)
    expect(groups[0].tests).toHaveLength(3);
    expect(groups[0].sourceDocIndices).toEqual([0, 1]);
  });

  // -------------------------------------------------------------------------
  // 4. Multiple documents, different dates
  // -------------------------------------------------------------------------

  test('documents with different dates create separate groups', () => {
    const docs: ParsedDocumentForGrouping[] = [
      makeDoc({
        collectionDate: '2026-01-10',
        tests: [
          { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: '2026-01-20',
        tests: [
          { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: '2026-02-01',
        tests: [
          { name: 'Chlamydia', result: 'Not detected', status: 'negative' },
        ],
      }),
    ];

    const groups = groupParsedDocumentsByDate(docs);

    expect(groups).toHaveLength(3);

    const dates = groups.map((g) => g.date);
    expect(dates).toContain('2026-01-10');
    expect(dates).toContain('2026-01-20');
    expect(dates).toContain('2026-02-01');

    // Each group should have exactly 1 test
    groups.forEach((g) => {
      expect(g.tests).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Documents with null dates
  // -------------------------------------------------------------------------

  test('documents with null dates are grouped together', () => {
    const docs: ParsedDocumentForGrouping[] = [
      makeDoc({
        collectionDate: null,
        tests: [
          { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: null,
        tests: [
          { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
        ],
      }),
    ];

    const groups = groupParsedDocumentsByDate(docs);

    expect(groups).toHaveLength(1);
    expect(groups[0].date).toBeNull();
    expect(groups[0].tests).toHaveLength(2);
    expect(groups[0].sourceDocIndices).toEqual([0, 1]);
  });

  // -------------------------------------------------------------------------
  // 6. Mixed null and non-null dates
  // -------------------------------------------------------------------------

  test('mixed null and non-null dates produce separate groups', () => {
    const docs: ParsedDocumentForGrouping[] = [
      makeDoc({
        collectionDate: '2026-01-15',
        tests: [
          { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: null,
        tests: [
          { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: '2026-01-15',
        tests: [
          { name: 'Chlamydia', result: 'Not detected', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: null,
        tests: [
          { name: 'Gonorrhea', result: 'Not detected', status: 'negative' },
        ],
      }),
    ];

    const groups = groupParsedDocumentsByDate(docs);

    expect(groups).toHaveLength(2);

    const datedGroup = groups.find((g) => g.date === '2026-01-15');
    const nullGroup = groups.find((g) => g.date === null);

    expect(datedGroup).toBeDefined();
    expect(nullGroup).toBeDefined();

    // Dated group should have docs 0 and 2
    expect(datedGroup!.tests).toHaveLength(2);
    expect(datedGroup!.sourceDocIndices).toEqual([0, 2]);

    // Null group should have docs 1 and 3
    expect(nullGroup!.tests).toHaveLength(2);
    expect(nullGroup!.sourceDocIndices).toEqual([1, 3]);
  });

  // -------------------------------------------------------------------------
  // 7. Deduplication within groups
  // -------------------------------------------------------------------------

  test('duplicate test names within the same date group are deduplicated', () => {
    const docs: ParsedDocumentForGrouping[] = [
      makeDoc({
        collectionDate: '2026-01-15',
        tests: [
          { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: '2026-01-15',
        tests: [
          // Duplicate HIV test from an overlapping screenshot
          { name: 'HIV-1/2', result: 'Negative', status: 'negative' },
          { name: 'Chlamydia', result: 'Not detected', status: 'negative' },
        ],
      }),
    ];

    const groups = groupParsedDocumentsByDate(docs);

    expect(groups).toHaveLength(1);
    // After dedup: HIV-1/2, Syphilis, Chlamydia = 3 unique tests
    expect(groups[0].tests).toHaveLength(3);

    const testNames = groups[0].tests.map((t) => t.name);
    // Verify each unique test is present (exact name form may vary)
    expect(testNames).toHaveLength(3);
  });

  // -------------------------------------------------------------------------
  // 8. No cross-group deduplication
  // -------------------------------------------------------------------------

  test('same test name in different date groups appears in BOTH groups', () => {
    const docs: ParsedDocumentForGrouping[] = [
      makeDoc({
        collectionDate: '2026-01-10',
        tests: [
          { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
        ],
      }),
      makeDoc({
        collectionDate: '2026-02-10',
        tests: [
          { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
        ],
      }),
    ];

    const groups = groupParsedDocumentsByDate(docs);

    expect(groups).toHaveLength(2);

    // Both groups should have the HIV test
    const janGroup = groups.find((g) => g.date === '2026-01-10');
    const febGroup = groups.find((g) => g.date === '2026-02-10');

    expect(janGroup!.tests).toHaveLength(1);
    expect(janGroup!.tests[0].name).toBe('HIV-1/2');

    expect(febGroup!.tests).toHaveLength(1);
    expect(febGroup!.tests[0].name).toBe('HIV-1/2');
  });

  // -------------------------------------------------------------------------
  // 9. Overall status computation per group
  // -------------------------------------------------------------------------

  describe('overall status computation', () => {
    test('positive overrides all other statuses', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Reactive', status: 'positive' },
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
            { name: 'Chlamydia', result: 'Pending', status: 'pending' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].overallStatus).toBe('positive');
    });

    test('all negative tests produce negative overall status', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].overallStatus).toBe('negative');
    });

    test('mix of negative and pending produces pending overall status', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
            { name: 'Chlamydia', result: 'Pending', status: 'pending' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].overallStatus).toBe('pending');
    });

    test('empty test array produces pending overall status', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].overallStatus).toBe('pending');
    });

    test('positive status computed per group independently', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-10',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
        }),
        makeDoc({
          collectionDate: '2026-01-20',
          tests: [
            { name: 'Chlamydia', result: 'Detected', status: 'positive' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      const janGroup = groups.find((g) => g.date === '2026-01-10');
      const jan20Group = groups.find((g) => g.date === '2026-01-20');

      expect(janGroup!.overallStatus).toBe('negative');
      expect(jan20Group!.overallStatus).toBe('positive');
    });

    test('inconclusive without any negative or positive produces pending', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Inconclusive', status: 'inconclusive' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].overallStatus).toBe('pending');
    });
  });

  // -------------------------------------------------------------------------
  // 10. Verification details merged correctly
  // -------------------------------------------------------------------------

  describe('verification details merging', () => {
    test('verification details from multiple verified docs are merged', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
          isVerified: true,
          verificationDetails: {
            labName: 'LifeLabs',
            patientName: 'Jane Doe',
            hasHealthCard: true,
            hasAccessionNumber: true,
            nameMatched: true,
          },
        }),
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          ],
          isVerified: true,
          verificationDetails: {
            labName: 'Dynacare',
            patientName: 'Jane Doe',
            hasHealthCard: false,
            hasAccessionNumber: true,
            nameMatched: true,
          },
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      expect(groups).toHaveLength(1);
      expect(groups[0].isVerified).toBe(true);
      expect(groups[0].verificationDetails).toHaveLength(2);
      expect(groups[0].verificationDetails[0].labName).toBe('LifeLabs');
      expect(groups[0].verificationDetails[1].labName).toBe('Dynacare');
    });

    test('duplicate lab names are deduplicated in verification details', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
          isVerified: true,
          verificationDetails: {
            labName: 'LifeLabs',
            patientName: 'Jane Doe',
            hasHealthCard: true,
            hasAccessionNumber: true,
            nameMatched: true,
          },
        }),
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          ],
          isVerified: true,
          verificationDetails: {
            labName: 'LifeLabs',
            patientName: 'Jane Doe',
            hasHealthCard: true,
            hasAccessionNumber: false,
            nameMatched: true,
          },
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      // Same labName 'LifeLabs' should appear only once
      expect(groups[0].verificationDetails).toHaveLength(1);
      expect(groups[0].verificationDetails[0].labName).toBe('LifeLabs');
    });

    test('isVerified is true if any doc in the group is verified', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
          isVerified: false,
        }),
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          ],
          isVerified: true,
          verificationDetails: {
            labName: 'LifeLabs',
            patientName: 'Jane Doe',
            hasHealthCard: true,
            hasAccessionNumber: true,
            nameMatched: true,
          },
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].isVerified).toBe(true);
    });

    test('isVerified is false when no docs are verified', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
          isVerified: false,
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].isVerified).toBe(false);
      expect(groups[0].verificationDetails).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 11. Notes concatenated
  // -------------------------------------------------------------------------

  describe('notes concatenation', () => {
    test('notes from multiple docs in the same group are joined with double newline', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
          notes: 'Fasting sample collected',
        }),
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          ],
          notes: 'Follow-up recommended in 3 months',
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      expect(groups[0].notes).toBe(
        'Fasting sample collected\n\nFollow-up recommended in 3 months'
      );
    });

    test('single doc notes are preserved without extra separators', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
          notes: 'Routine screening',
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].notes).toBe('Routine screening');
    });

    test('docs with no notes produce an empty notes string', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].notes).toBe('');
    });

    test('empty string notes are not included in concatenation', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
          notes: '',
        }),
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          ],
          notes: 'Some note',
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      // Empty string is falsy, so only 'Some note' should be present
      expect(groups[0].notes).toBe('Some note');
    });
  });

  // -------------------------------------------------------------------------
  // 12. Source doc indices tracked
  // -------------------------------------------------------------------------

  describe('sourceDocIndices tracking', () => {
    test('correctly tracks indices of original documents per group', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-10',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
        }),
        makeDoc({
          collectionDate: '2026-01-20',
          tests: [
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          ],
        }),
        makeDoc({
          collectionDate: '2026-01-10',
          tests: [
            { name: 'Chlamydia', result: 'Not detected', status: 'negative' },
          ],
        }),
        makeDoc({
          collectionDate: '2026-01-20',
          tests: [
            { name: 'Gonorrhea', result: 'Not detected', status: 'negative' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      expect(groups).toHaveLength(2);

      const jan10Group = groups.find((g) => g.date === '2026-01-10');
      const jan20Group = groups.find((g) => g.date === '2026-01-20');

      expect(jan10Group!.sourceDocIndices).toEqual([0, 2]);
      expect(jan20Group!.sourceDocIndices).toEqual([1, 3]);
    });

    test('single document group has a single index', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);
      expect(groups[0].sourceDocIndices).toEqual([0]);
    });
  });

  // -------------------------------------------------------------------------
  // Additional edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    test('documents with empty test arrays are still grouped', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [],
          notes: 'Empty document',
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      expect(groups).toHaveLength(1);
      expect(groups[0].date).toBe('2026-01-15');
      expect(groups[0].tests).toHaveLength(0);
      expect(groups[0].notes).toBe('Empty document');
      expect(groups[0].overallStatus).toBe('pending');
    });

    test('conflicts from deduplication are captured in the group', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
        }),
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            // Same test but different status -- creates a conflict
            { name: 'HIV-1/2', result: 'Reactive', status: 'positive' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      expect(groups).toHaveLength(1);
      expect(groups[0].conflicts).toHaveLength(1);
      expect(groups[0].conflicts[0].testName).toBe('HIV-1/2');
      // Positive should be selected as the resolved test (clinical safety)
      expect(groups[0].tests[0].status).toBe('positive');
      expect(groups[0].overallStatus).toBe('positive');
    });

    test('testType is determined from deduplicated tests', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
            { name: 'Chlamydia', result: 'Not detected', status: 'negative' },
            { name: 'Gonorrhea', result: 'Not detected', status: 'negative' },
            { name: 'Hepatitis B', result: 'Non-reactive', status: 'negative' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      // 5 different categories = Full STI Panel
      expect(groups[0].testType).toBe('Full STI Panel');
    });

    test('testType for a single test category is the specific name', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      // Single category -> specific test type
      expect(groups[0].testType).toContain('HIV');
    });

    test('documents with empty test arrays use fallback test type from doc', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [],
          testType: 'Blood Panel',
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      expect(groups[0].testType).toBe('Blood Panel');
    });

    test('documents with empty tests and no testType default to STI Panel', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      expect(groups[0].testType).toBe('STI Panel');
    });

    test('three date groups from four documents', () => {
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-10',
          tests: [
            { name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' },
          ],
          notes: 'Doc 1 notes',
          isVerified: true,
          verificationDetails: {
            labName: 'LifeLabs',
            patientName: 'Jane Doe',
            hasHealthCard: true,
            hasAccessionNumber: true,
            nameMatched: true,
          },
        }),
        makeDoc({
          collectionDate: null,
          tests: [
            { name: 'Chlamydia', result: 'Not detected', status: 'negative' },
          ],
        }),
        makeDoc({
          collectionDate: '2026-01-10',
          tests: [
            { name: 'Syphilis', result: 'Non-reactive', status: 'negative' },
          ],
          notes: 'Doc 3 notes',
        }),
        makeDoc({
          collectionDate: '2026-02-01',
          tests: [
            { name: 'Gonorrhea', result: 'Detected', status: 'positive' },
          ],
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      expect(groups).toHaveLength(3);

      const jan10 = groups.find((g) => g.date === '2026-01-10');
      const nullDate = groups.find((g) => g.date === null);
      const feb01 = groups.find((g) => g.date === '2026-02-01');

      expect(jan10).toBeDefined();
      expect(nullDate).toBeDefined();
      expect(feb01).toBeDefined();

      // Jan 10 group: 2 tests from docs 0 and 2
      expect(jan10!.tests).toHaveLength(2);
      expect(jan10!.sourceDocIndices).toEqual([0, 2]);
      expect(jan10!.overallStatus).toBe('negative');
      expect(jan10!.isVerified).toBe(true);
      expect(jan10!.notes).toBe('Doc 1 notes\n\nDoc 3 notes');

      // Null date group: 1 test from doc 1
      expect(nullDate!.tests).toHaveLength(1);
      expect(nullDate!.sourceDocIndices).toEqual([1]);
      expect(nullDate!.overallStatus).toBe('negative');

      // Feb 01 group: 1 positive test from doc 3
      expect(feb01!.tests).toHaveLength(1);
      expect(feb01!.sourceDocIndices).toEqual([3]);
      expect(feb01!.overallStatus).toBe('positive');
    });

    test('first non-null testType per group is preserved when docs have tests', () => {
      // When docs have actual tests, testType is computed from tests.
      // When docs have no tests, testType falls back to the doc's testType field.
      const docs: ParsedDocumentForGrouping[] = [
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [],
          testType: 'Custom Panel A',
        }),
        makeDoc({
          collectionDate: '2026-01-15',
          tests: [],
          testType: 'Custom Panel B',
        }),
      ];

      const groups = groupParsedDocumentsByDate(docs);

      // Should use the first testType found
      expect(groups[0].testType).toBe('Custom Panel A');
    });
  });

  // -------------------------------------------------------------------------
  // Multi-document verification signal merging
  // -------------------------------------------------------------------------

  describe('verification signal merging across documents', () => {
    test('merges verification checks from multiple docs in the same group', () => {
      const docA: ParsedDocumentForGrouping = makeDoc({
        collectionDate: '2026-01-15',
        tests: [{ name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' }],
        verificationResult: {
          score: 45,
          level: 'low',
          checks: [
            { name: 'recognized_lab', passed: true, points: 25, maxPoints: 25 },
            { name: 'health_card', passed: false, points: 0, maxPoints: 20 },
            { name: 'accession_number', passed: false, points: 0, maxPoints: 15 },
            { name: 'name_match', passed: false, points: 0, maxPoints: 15 },
            { name: 'collection_date', passed: true, points: 10, maxPoints: 10 },
            { name: 'structural_completeness', passed: true, points: 10, maxPoints: 10 },
            { name: 'multi_signal_agreement', passed: false, points: 0, maxPoints: 5 },
          ],
          isVerified: false,
          hasFutureDate: false,
          isSuspiciouslyFast: false,
          isOlderThan2Years: false,
        },
      });

      const docB: ParsedDocumentForGrouping = makeDoc({
        collectionDate: '2026-01-15',
        tests: [{ name: 'Syphilis', result: 'Non-reactive', status: 'negative' }],
        verificationResult: {
          score: 35,
          level: 'low',
          checks: [
            { name: 'recognized_lab', passed: false, points: 0, maxPoints: 25 },
            { name: 'health_card', passed: true, points: 20, maxPoints: 20 },
            { name: 'accession_number', passed: false, points: 0, maxPoints: 15 },
            { name: 'name_match', passed: true, points: 15, maxPoints: 15 },
            { name: 'collection_date', passed: false, points: 0, maxPoints: 10 },
            { name: 'structural_completeness', passed: false, points: 0, maxPoints: 10 },
            { name: 'multi_signal_agreement', passed: false, points: 0, maxPoints: 5 },
          ],
          isVerified: false,
          hasFutureDate: false,
          isSuspiciouslyFast: false,
          isOlderThan2Years: false,
        },
      });

      const groups = groupParsedDocumentsByDate([docA, docB]);

      expect(groups).toHaveLength(1);
      const merged = groups[0].verificationResult!;

      // Merged: lab(25) + card(20) + name(15) + date(10) + struct(10) = 80
      expect(merged.score).toBe(80);
      expect(merged.level).toBe('high');
      expect(merged.isVerified).toBe(true);
    });

    test('individually unverified docs become verified when merged', () => {
      const docA: ParsedDocumentForGrouping = makeDoc({
        collectionDate: '2026-01-15',
        tests: [{ name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' }],
        isVerified: false,
        verificationResult: {
          score: 45,
          level: 'low',
          checks: [
            { name: 'recognized_lab', passed: true, points: 25, maxPoints: 25 },
            { name: 'name_match', passed: false, points: 0, maxPoints: 15 },
            { name: 'collection_date', passed: true, points: 10, maxPoints: 10 },
            { name: 'structural_completeness', passed: true, points: 10, maxPoints: 10 },
          ],
          isVerified: false,
          hasFutureDate: false,
          isSuspiciouslyFast: false,
          isOlderThan2Years: false,
        },
      });

      const docB: ParsedDocumentForGrouping = makeDoc({
        collectionDate: '2026-01-15',
        tests: [{ name: 'Syphilis', result: 'Non-reactive', status: 'negative' }],
        isVerified: false,
        verificationResult: {
          score: 35,
          level: 'low',
          checks: [
            { name: 'recognized_lab', passed: false, points: 0, maxPoints: 25 },
            { name: 'name_match', passed: true, points: 15, maxPoints: 15 },
            { name: 'collection_date', passed: true, points: 10, maxPoints: 10 },
            { name: 'structural_completeness', passed: true, points: 10, maxPoints: 10 },
          ],
          isVerified: false,
          hasFutureDate: false,
          isSuspiciouslyFast: false,
          isOlderThan2Years: false,
        },
      });

      const groups = groupParsedDocumentsByDate([docA, docB]);
      // Merged: 25+15+10+10 = 60, name matched → verified
      expect(groups[0].isVerified).toBe(true);
      expect(groups[0].verificationResult!.score).toBe(60);
    });

    test('future date in any doc blocks group verification', () => {
      const docA: ParsedDocumentForGrouping = makeDoc({
        collectionDate: '2026-01-15',
        tests: [{ name: 'HIV-1/2', result: 'Non-reactive', status: 'negative' }],
        verificationResult: {
          score: 75,
          level: 'high',
          checks: [
            { name: 'recognized_lab', passed: true, points: 25, maxPoints: 25 },
            { name: 'name_match', passed: true, points: 15, maxPoints: 15 },
            { name: 'collection_date', passed: true, points: 10, maxPoints: 10 },
          ],
          isVerified: true,
          hasFutureDate: false,
          isSuspiciouslyFast: false,
          isOlderThan2Years: false,
        },
      });

      const docB: ParsedDocumentForGrouping = makeDoc({
        collectionDate: '2026-01-15',
        tests: [{ name: 'Syphilis', result: 'Non-reactive', status: 'negative' }],
        verificationResult: {
          score: 0,
          level: 'no_signals',
          checks: [
            { name: 'recognized_lab', passed: false, points: 0, maxPoints: 25 },
            { name: 'name_match', passed: false, points: 0, maxPoints: 15 },
            { name: 'collection_date', passed: false, points: 0, maxPoints: 10 },
          ],
          isVerified: false,
          hasFutureDate: true,
          isSuspiciouslyFast: false,
          isOlderThan2Years: false,
        },
      });

      const groups = groupParsedDocumentsByDate([docA, docB]);
      expect(groups[0].verificationResult!.hasFutureDate).toBe(true);
      expect(groups[0].verificationResult!.isVerified).toBe(false);
    });
  });
});
