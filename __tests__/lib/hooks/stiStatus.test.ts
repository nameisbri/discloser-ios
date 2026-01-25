/**
 * STI Status Aggregation Tests
 *
 * Tests the logic for aggregating STI test results across multiple tests.
 */

type TestStatus = 'negative' | 'positive' | 'pending' | 'inconclusive';

interface STIResult {
  name: string;
  result: string;
  status: TestStatus;
}

interface TestResult {
  id: string;
  user_id: string;
  test_date: string;
  status: TestStatus;
  test_type: string;
  sti_results: STIResult[];
  is_verified: boolean;
}

interface KnownCondition {
  condition: string;
  added_at: string;
  notes?: string;
}

interface AggregatedSTI {
  name: string;
  status: TestStatus;
  result: string;
  testDate: string;
  isVerified: boolean;
  isKnownCondition: boolean;
  isStatusSTI: boolean;
  hasTestData?: boolean;
}

// Simplified matching logic
function matchesKnownCondition(stiName: string, knownConditions: KnownCondition[]): boolean {
  const name = stiName.toLowerCase();
  return knownConditions.some((kc) => {
    const cond = kc.condition.toLowerCase();
    if (cond === name) return true;
    if (cond.includes('hiv') && name.includes('hiv')) return true;
    if ((cond.includes('hsv-1') || cond.includes('hsv1')) && (name.includes('hsv-1') || name.includes('hsv1'))) return true;
    if ((cond.includes('hsv-2') || cond.includes('hsv2')) && (name.includes('hsv-2') || name.includes('hsv2'))) return true;
    if ((cond.includes('hepatitis b') || cond.includes('hbv')) && (name.includes('hepatitis b') || name.includes('hbv'))) return true;
    if ((cond.includes('hepatitis c') || cond.includes('hcv')) && (name.includes('hepatitis c') || name.includes('hcv'))) return true;
    return false;
  });
}

function isStatusSTI(testName: string): boolean {
  const patterns = [/hiv/i, /hsv[-\s]?[12]/i, /herpes/i, /hepatitis\s*[bc]/i, /hbv/i, /hcv/i];
  return patterns.some((p) => p.test(testName));
}

/**
 * Aggregates STI results from multiple test results
 * Keeps the most recent result for each STI
 */
function aggregateSTIStatus(results: TestResult[], knownConditions: KnownCondition[]): AggregatedSTI[] {
  const stiMap = new Map<string, AggregatedSTI>();

  // Process all results, keeping most recent per STI
  for (const result of results) {
    const stiResults = result.sti_results;
    if (!stiResults || !Array.isArray(stiResults) || stiResults.length === 0) continue;

    for (const sti of stiResults) {
      if (!sti.name || !sti.status) continue;

      const existing = stiMap.get(sti.name);
      const testDate = result.test_date;

      // Keep if no existing or this one is more recent
      if (!existing || testDate > existing.testDate) {
        const isKnown = matchesKnownCondition(sti.name, knownConditions);
        stiMap.set(sti.name, {
          name: sti.name,
          status: sti.status,
          result: sti.result || sti.status.charAt(0).toUpperCase() + sti.status.slice(1),
          testDate: testDate,
          isVerified: result.is_verified || false,
          isKnownCondition: isKnown,
          isStatusSTI: isStatusSTI(sti.name),
          hasTestData: true,
        });
      }
    }
  }

  // Add known conditions that don't have test results
  for (const kc of knownConditions) {
    // Check if this known condition matches any existing STI in the map
    let foundMatch = false;
    for (const [stiName, stiData] of stiMap.entries()) {
      if (matchesKnownCondition(stiName, [kc])) {
        // Found a test result that matches this known condition
        stiMap.set(stiName, { ...stiData, hasTestData: true });
        foundMatch = true;
        break;
      }
    }

    // If no matching test result found, add placeholder entry
    if (!foundMatch) {
      stiMap.set(kc.condition, {
        name: kc.condition,
        status: 'pending',
        result: 'Not recently tested',
        testDate: kc.added_at,
        isVerified: false,
        isKnownCondition: true,
        isStatusSTI: isStatusSTI(kc.condition),
        hasTestData: false,
      });
    }
  }

  return [...stiMap.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Calculates overall status from aggregated results
 * Excludes known conditions
 */
function calculateOverallStatus(aggregated: AggregatedSTI[]): TestStatus {
  const routineStatus = aggregated.filter(s => !s.isKnownCondition);

  if (routineStatus.length === 0) return 'pending';
  const hasPositive = routineStatus.some(s => s.status === 'positive');
  const hasPending = routineStatus.some(s => s.status === 'pending');
  if (hasPositive) return 'positive';
  if (hasPending) return 'pending';
  return 'negative';
}

/**
 * Gets the most recent test date from aggregated results
 */
function getLastTestedDate(aggregated: AggregatedSTI[]): string | null {
  if (aggregated.length === 0) return null;
  return aggregated.reduce((latest, sti) =>
    sti.testDate > latest ? sti.testDate : latest
  , aggregated[0].testDate);
}

// Helper to create test results
function createTestResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    id: 'test-id',
    user_id: 'user-id',
    test_date: '2024-01-15',
    status: 'negative',
    test_type: 'Full STI Panel',
    sti_results: [],
    is_verified: true,
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('aggregateSTIStatus', () => {
  describe('Basic Aggregation', () => {
    test('aggregates single test result', () => {
      const results = [
        createTestResult({
          sti_results: [
            { name: 'HIV', result: 'Negative', status: 'negative' },
            { name: 'Chlamydia', result: 'Negative', status: 'negative' },
          ],
        }),
      ];

      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated).toHaveLength(2);
      expect(aggregated.find(s => s.name === 'HIV')).toBeDefined();
      expect(aggregated.find(s => s.name === 'Chlamydia')).toBeDefined();
    });

    test('keeps most recent result for each STI', () => {
      const results = [
        createTestResult({
          test_date: '2024-01-15',
          sti_results: [{ name: 'HIV', result: 'Negative', status: 'negative' }],
        }),
        createTestResult({
          test_date: '2024-02-15', // More recent
          sti_results: [{ name: 'HIV', result: 'Positive', status: 'positive' }],
        }),
      ];

      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].status).toBe('positive');
      expect(aggregated[0].testDate).toBe('2024-02-15');
    });

    test('combines different STIs from multiple results', () => {
      const results = [
        createTestResult({
          test_date: '2024-01-15',
          sti_results: [{ name: 'HIV', result: 'Negative', status: 'negative' }],
        }),
        createTestResult({
          test_date: '2024-02-15',
          sti_results: [{ name: 'Chlamydia', result: 'Negative', status: 'negative' }],
        }),
      ];

      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated).toHaveLength(2);
    });

    test('sorts results alphabetically by name', () => {
      const results = [
        createTestResult({
          sti_results: [
            { name: 'Syphilis', result: 'Negative', status: 'negative' },
            { name: 'Chlamydia', result: 'Negative', status: 'negative' },
            { name: 'HIV', result: 'Negative', status: 'negative' },
          ],
        }),
      ];

      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated[0].name).toBe('Chlamydia');
      expect(aggregated[1].name).toBe('HIV');
      expect(aggregated[2].name).toBe('Syphilis');
    });
  });

  describe('Known Condition Detection', () => {
    test('marks known conditions correctly', () => {
      const results = [
        createTestResult({
          sti_results: [
            { name: 'HIV', result: 'Positive', status: 'positive' },
            { name: 'Chlamydia', result: 'Negative', status: 'negative' },
          ],
        }),
      ];
      const knownConditions = [{ condition: 'HIV-1/2', added_at: '2020-01-01' }];

      const aggregated = aggregateSTIStatus(results, knownConditions);
      expect(aggregated.find(s => s.name === 'HIV')?.isKnownCondition).toBe(true);
      expect(aggregated.find(s => s.name === 'Chlamydia')?.isKnownCondition).toBe(false);
    });
  });

  describe('Status STI Detection', () => {
    test('identifies status STIs (chronic conditions)', () => {
      const results = [
        createTestResult({
          sti_results: [
            { name: 'HIV', result: 'Negative', status: 'negative' },
            { name: 'Herpes (HSV-1)', result: 'Positive', status: 'positive' },
            { name: 'Chlamydia', result: 'Negative', status: 'negative' },
          ],
        }),
      ];

      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated.find(s => s.name === 'HIV')?.isStatusSTI).toBe(true);
      expect(aggregated.find(s => s.name === 'Herpes (HSV-1)')?.isStatusSTI).toBe(true);
      expect(aggregated.find(s => s.name === 'Chlamydia')?.isStatusSTI).toBe(false);
    });
  });

  describe('Verification Status', () => {
    test('preserves verification status', () => {
      const results = [
        createTestResult({
          is_verified: true,
          sti_results: [{ name: 'HIV', result: 'Negative', status: 'negative' }],
        }),
        createTestResult({
          is_verified: false,
          sti_results: [{ name: 'Chlamydia', result: 'Negative', status: 'negative' }],
        }),
      ];

      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated.find(s => s.name === 'HIV')?.isVerified).toBe(true);
      expect(aggregated.find(s => s.name === 'Chlamydia')?.isVerified).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty results array', () => {
      const aggregated = aggregateSTIStatus([], []);
      expect(aggregated).toHaveLength(0);
    });

    test('handles results with empty sti_results', () => {
      const results = [createTestResult({ sti_results: [] })];
      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated).toHaveLength(0);
    });

    test('handles null sti_results', () => {
      const results = [createTestResult({ sti_results: null as any })];
      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated).toHaveLength(0);
    });

    test('skips STIs without name or status', () => {
      const results = [
        createTestResult({
          sti_results: [
            { name: '', result: 'Negative', status: 'negative' },
            { name: 'HIV', result: 'Negative', status: '' as any },
            { name: 'Chlamydia', result: 'Negative', status: 'negative' },
          ],
        }),
      ];

      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].name).toBe('Chlamydia');
    });

    test('generates result text from status if missing', () => {
      const results = [
        createTestResult({
          sti_results: [
            { name: 'HIV', result: '', status: 'negative' },
          ],
        }),
      ];

      const aggregated = aggregateSTIStatus(results, []);
      expect(aggregated[0].result).toBe('Negative');
    });
  });
});

describe('calculateOverallStatus', () => {
  test('returns negative when all routine results are negative', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: true },
      { name: 'Chlamydia', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: false },
    ];

    expect(calculateOverallStatus(aggregated)).toBe('negative');
  });

  test('returns positive when any routine result is positive', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: true },
      { name: 'Chlamydia', status: 'positive', result: 'Positive', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: false },
    ];

    expect(calculateOverallStatus(aggregated)).toBe('positive');
  });

  test('returns pending when any routine result is pending (no positives)', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: true },
      { name: 'Chlamydia', status: 'pending', result: 'Pending', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: false },
    ];

    expect(calculateOverallStatus(aggregated)).toBe('pending');
  });

  test('excludes known conditions from overall status', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'positive', result: 'Positive', testDate: '2024-01-15', isVerified: true, isKnownCondition: true, isStatusSTI: true },
      { name: 'Chlamydia', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: false },
    ];

    // HIV is known condition, so only Chlamydia counts
    expect(calculateOverallStatus(aggregated)).toBe('negative');
  });

  test('returns pending for empty array', () => {
    expect(calculateOverallStatus([])).toBe('pending');
  });

  test('returns pending when all results are known conditions', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'positive', result: 'Positive', testDate: '2024-01-15', isVerified: true, isKnownCondition: true, isStatusSTI: true },
    ];

    expect(calculateOverallStatus(aggregated)).toBe('pending');
  });
});

describe('getLastTestedDate', () => {
  test('returns most recent date', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: true },
      { name: 'Chlamydia', status: 'negative', result: 'Negative', testDate: '2024-02-20', isVerified: true, isKnownCondition: false, isStatusSTI: false },
      { name: 'Syphilis', status: 'negative', result: 'Negative', testDate: '2024-01-10', isVerified: true, isKnownCondition: false, isStatusSTI: false },
    ];

    expect(getLastTestedDate(aggregated)).toBe('2024-02-20');
  });

  test('returns null for empty array', () => {
    expect(getLastTestedDate([])).toBeNull();
  });

  test('returns single date for single result', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: true },
    ];

    expect(getLastTestedDate(aggregated)).toBe('2024-01-15');
  });
});

describe('New Status Positives Detection', () => {
  function getNewStatusPositives(aggregated: AggregatedSTI[]): AggregatedSTI[] {
    return aggregated.filter(s => s.isStatusSTI && s.status === 'positive' && !s.isKnownCondition);
  }

  test('detects new positive status STIs', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'positive', result: 'Positive', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: true },
      { name: 'Chlamydia', status: 'positive', result: 'Positive', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: false },
    ];

    const newPositives = getNewStatusPositives(aggregated);
    expect(newPositives).toHaveLength(1);
    expect(newPositives[0].name).toBe('HIV');
  });

  test('excludes already known conditions', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'positive', result: 'Positive', testDate: '2024-01-15', isVerified: true, isKnownCondition: true, isStatusSTI: true },
    ];

    const newPositives = getNewStatusPositives(aggregated);
    expect(newPositives).toHaveLength(0);
  });

  test('excludes negative status STIs', () => {
    const aggregated: AggregatedSTI[] = [
      { name: 'HIV', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: true },
    ];

    const newPositives = getNewStatusPositives(aggregated);
    expect(newPositives).toHaveLength(0);
  });
});

describe('Known Conditions Without Test Data', () => {
  test('adds known condition without test results as placeholder', () => {
    const results: TestResult[] = [];
    const knownConditions: KnownCondition[] = [
      { condition: 'HIV-1/2', added_at: '2020-01-01', notes: 'Diagnosed in 2020' },
    ];

    const aggregated = aggregateSTIStatus(results, knownConditions);
    expect(aggregated).toHaveLength(1);
    expect(aggregated[0]).toEqual({
      name: 'HIV-1/2',
      status: 'pending',
      result: 'Not recently tested',
      testDate: '2020-01-01',
      isVerified: false,
      isKnownCondition: true,
      isStatusSTI: true,
      hasTestData: false,
    });
  });

  test('adds multiple known conditions without test results', () => {
    const results: TestResult[] = [];
    const knownConditions: KnownCondition[] = [
      { condition: 'HIV-1/2', added_at: '2020-01-01' },
      { condition: 'Herpes (HSV-2)', added_at: '2019-06-15' },
    ];

    const aggregated = aggregateSTIStatus(results, knownConditions);
    expect(aggregated).toHaveLength(2);

    const hiv = aggregated.find(s => s.name === 'HIV-1/2');
    expect(hiv?.hasTestData).toBe(false);
    expect(hiv?.isKnownCondition).toBe(true);
    expect(hiv?.status).toBe('pending');

    const hsv = aggregated.find(s => s.name === 'Herpes (HSV-2)');
    expect(hsv?.hasTestData).toBe(false);
    expect(hsv?.isKnownCondition).toBe(true);
    expect(hsv?.status).toBe('pending');
  });

  test('sets hasTestData to true for known conditions with test results', () => {
    const results: TestResult[] = [
      createTestResult({
        test_date: '2024-01-15',
        sti_results: [{ name: 'HIV', result: 'Positive', status: 'positive' }],
      }),
    ];
    const knownConditions: KnownCondition[] = [
      { condition: 'HIV-1/2', added_at: '2020-01-01' },
    ];

    const aggregated = aggregateSTIStatus(results, knownConditions);
    expect(aggregated).toHaveLength(1);

    const hiv = aggregated[0];
    expect(hiv.hasTestData).toBe(true);
    expect(hiv.isKnownCondition).toBe(true);
    expect(hiv.status).toBe('positive');
    expect(hiv.testDate).toBe('2024-01-15'); // Uses test date, not added_at
  });

  test('combines test results with known conditions without tests', () => {
    const results: TestResult[] = [
      createTestResult({
        test_date: '2024-01-15',
        sti_results: [
          { name: 'HIV', result: 'Positive', status: 'positive' },
          { name: 'Chlamydia', result: 'Negative', status: 'negative' },
        ],
      }),
    ];
    const knownConditions: KnownCondition[] = [
      { condition: 'HIV-1/2', added_at: '2020-01-01' },
      { condition: 'Herpes (HSV-2)', added_at: '2019-06-15' },
    ];

    const aggregated = aggregateSTIStatus(results, knownConditions);
    expect(aggregated).toHaveLength(3);

    // HIV has test data and is known
    const hiv = aggregated.find(s => s.name === 'HIV');
    expect(hiv?.hasTestData).toBe(true);
    expect(hiv?.isKnownCondition).toBe(true);

    // Chlamydia has test data but is not known
    const chlamydia = aggregated.find(s => s.name === 'Chlamydia');
    expect(chlamydia?.hasTestData).toBe(true);
    expect(chlamydia?.isKnownCondition).toBe(false);

    // HSV-2 is known but has no test data
    const hsv = aggregated.find(s => s.name === 'Herpes (HSV-2)');
    expect(hsv?.hasTestData).toBe(false);
    expect(hsv?.isKnownCondition).toBe(true);
    expect(hsv?.status).toBe('pending');
    expect(hsv?.result).toBe('Not recently tested');
  });

  test('uses added_at as testDate for known conditions without tests', () => {
    const results: TestResult[] = [];
    const knownConditions: KnownCondition[] = [
      { condition: 'HIV-1/2', added_at: '2020-03-15' },
    ];

    const aggregated = aggregateSTIStatus(results, knownConditions);
    expect(aggregated[0].testDate).toBe('2020-03-15');
  });

  test('known conditions without tests are included in knownConditionsStatus', () => {
    const results: TestResult[] = [];
    const knownConditions: KnownCondition[] = [
      { condition: 'HIV-1/2', added_at: '2020-01-01' },
    ];

    const aggregated = aggregateSTIStatus(results, knownConditions);
    const knownConditionsStatus = aggregated.filter(s => s.isKnownCondition);

    expect(knownConditionsStatus).toHaveLength(1);
    expect(knownConditionsStatus[0].name).toBe('HIV-1/2');
  });

  test('known conditions without tests do not affect overall status', () => {
    const aggregated: AggregatedSTI[] = [
      // Known condition without test data
      { name: 'HIV-1/2', status: 'pending', result: 'Not recently tested', testDate: '2020-01-01', isVerified: false, isKnownCondition: true, isStatusSTI: true, hasTestData: false },
      // Regular negative result
      { name: 'Chlamydia', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true, isKnownCondition: false, isStatusSTI: false, hasTestData: true },
    ];

    // Should be negative because known conditions are excluded
    expect(calculateOverallStatus(aggregated)).toBe('negative');
  });

  test('all test results have hasTestData set to true', () => {
    const results: TestResult[] = [
      createTestResult({
        sti_results: [
          { name: 'HIV', result: 'Negative', status: 'negative' },
          { name: 'Chlamydia', result: 'Negative', status: 'negative' },
        ],
      }),
    ];

    const aggregated = aggregateSTIStatus(results, []);
    expect(aggregated.every(s => s.hasTestData === true)).toBe(true);
  });

  test('sorts known conditions without tests alphabetically with test results', () => {
    const results: TestResult[] = [
      createTestResult({
        sti_results: [
          { name: 'Syphilis', result: 'Negative', status: 'negative' },
        ],
      }),
    ];
    const knownConditions: KnownCondition[] = [
      { condition: 'HIV-1/2', added_at: '2020-01-01' },
      { condition: 'Herpes (HSV-2)', added_at: '2019-06-15' },
    ];

    const aggregated = aggregateSTIStatus(results, knownConditions);
    expect(aggregated).toHaveLength(3);

    // Should be alphabetically sorted
    expect(aggregated[0].name).toBe('Herpes (HSV-2)');
    expect(aggregated[1].name).toBe('HIV-1/2');
    expect(aggregated[2].name).toBe('Syphilis');
  });

  test('handles known condition matching with test result variations', () => {
    const results: TestResult[] = [
      createTestResult({
        test_date: '2024-01-15',
        sti_results: [{ name: 'HIV', result: 'Positive', status: 'positive' }],
      }),
    ];
    const knownConditions: KnownCondition[] = [
      { condition: 'HIV-1/2', added_at: '2020-01-01' }, // Different format
    ];

    const aggregated = aggregateSTIStatus(results, knownConditions);

    // Should match and mark the test result as known condition
    const hiv = aggregated.find(s => s.name === 'HIV');
    expect(hiv?.isKnownCondition).toBe(true);
    expect(hiv?.hasTestData).toBe(true);

    // Should NOT add duplicate placeholder because it matched
    expect(aggregated).toHaveLength(1);
  });
});
