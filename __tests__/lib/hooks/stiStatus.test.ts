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
        });
      }
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
