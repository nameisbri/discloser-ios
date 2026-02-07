/**
 * Testing Recommendations Tests
 *
 * Tests the calculation of testing schedules based on risk level.
 */

type RiskLevel = 'low' | 'moderate' | 'high';
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

interface TestingRecommendation {
  lastTestDate: string | null;
  nextDueDate: string | null;
  daysUntilDue: number | null;
  isOverdue: boolean;
  isDueSoon: boolean;
  riskLevel: RiskLevel | null;
  intervalDays: number | null;
}

// Testing intervals in days by risk level
const INTERVALS: Record<RiskLevel, number> = {
  low: 365,      // 12 months
  moderate: 180, // 6 months
  high: 90,      // 3 months
};

const ROUTINE_TESTS = ['hiv', 'syphilis', 'chlamydia', 'gonorrhea'];
const ROUTINE_PANEL_KEYWORDS = ['basic', 'full', 'std', 'sti', 'routine', 'panel', '4-test'];

function hasRoutineTests(result: TestResult): boolean {
  const hasRoutineSTI = result.sti_results?.some((sti) =>
    ROUTINE_TESTS.some((routine) => sti.name.toLowerCase().includes(routine))
  );
  if (hasRoutineSTI) return true;

  const testType = result.test_type?.toLowerCase() || '';
  return ROUTINE_PANEL_KEYWORDS.some((kw) => testType.includes(kw));
}

function calculateTestingRecommendation(
  results: TestResult[],
  riskLevel: RiskLevel | null
): TestingRecommendation {
  const routineResults = results.filter(hasRoutineTests);

  if (!riskLevel || routineResults.length === 0) {
    return {
      lastTestDate: routineResults[0]?.test_date || null,
      nextDueDate: null,
      daysUntilDue: null,
      isOverdue: false,
      isDueSoon: false,
      riskLevel,
      intervalDays: riskLevel ? INTERVALS[riskLevel] : null,
    };
  }

  const lastTestDate = routineResults[0].test_date;
  const intervalDays = INTERVALS[riskLevel];

  const [year, month, day] = lastTestDate.split('-').map(Number);
  const lastDate = new Date(year, month - 1, day);
  const nextDue = new Date(lastDate);
  nextDue.setDate(nextDue.getDate() + intervalDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDue.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    lastTestDate,
    nextDueDate: `${nextDue.getFullYear()}-${String(nextDue.getMonth() + 1).padStart(2, '0')}-${String(nextDue.getDate()).padStart(2, '0')}`,
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
    isDueSoon: daysUntilDue >= 0 && daysUntilDue <= 14,
    riskLevel,
    intervalDays,
  };
}

function formatDueMessage(rec: TestingRecommendation): string | null {
  if (!rec.riskLevel || rec.daysUntilDue === null) return null;

  if (rec.isOverdue) {
    const days = Math.abs(rec.daysUntilDue);
    return `You're ${days} day${days !== 1 ? 's' : ''} overdue for testing`;
  }

  if (rec.isDueSoon) {
    if (rec.daysUntilDue === 0) return 'Your next test is due today';
    return `Your next test is due in ${rec.daysUntilDue} day${rec.daysUntilDue !== 1 ? 's' : ''}`;
  }

  return null;
}

// Helper to create test results
function createTestResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    id: 'test-id',
    user_id: 'user-id',
    test_date: '2024-01-15',
    status: 'negative',
    test_type: 'Full STI Panel',
    sti_results: [
      { name: 'HIV', result: 'Negative', status: 'negative' },
      { name: 'Chlamydia', result: 'Negative', status: 'negative' },
    ],
    is_verified: true,
    ...overrides,
  };
}

// Helper to get date string N days from a base date
function daysFromDate(baseDate: string, days: number): string {
  const [year, month, day] = baseDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================
// TESTS
// ============================================

describe('hasRoutineTests', () => {
  test('detects routine STIs in sti_results', () => {
    expect(hasRoutineTests(createTestResult({
      sti_results: [{ name: 'HIV', result: 'Negative', status: 'negative' }],
    }))).toBe(true);

    expect(hasRoutineTests(createTestResult({
      sti_results: [{ name: 'Chlamydia', result: 'Negative', status: 'negative' }],
    }))).toBe(true);

    expect(hasRoutineTests(createTestResult({
      sti_results: [{ name: 'Gonorrhea', result: 'Negative', status: 'negative' }],
    }))).toBe(true);

    expect(hasRoutineTests(createTestResult({
      sti_results: [{ name: 'Syphilis', result: 'Negative', status: 'negative' }],
    }))).toBe(true);
  });

  test('detects routine panels by test_type', () => {
    expect(hasRoutineTests(createTestResult({
      test_type: 'Full STI Panel',
      sti_results: [],
    }))).toBe(true);

    expect(hasRoutineTests(createTestResult({
      test_type: 'Basic STD Screen',
      sti_results: [],
    }))).toBe(true);

    expect(hasRoutineTests(createTestResult({
      test_type: '4-Test Panel',
      sti_results: [],
    }))).toBe(true);
  });

  test('does NOT detect non-routine tests', () => {
    expect(hasRoutineTests(createTestResult({
      test_type: 'Herpes Test',
      sti_results: [{ name: 'HSV-1', result: 'Negative', status: 'negative' }],
    }))).toBe(false);
  });
});

describe('calculateTestingRecommendation', () => {
  describe('Interval Calculation', () => {
    test('uses 365 days for low risk', () => {
      const result = calculateTestingRecommendation([createTestResult()], 'low');
      expect(result.intervalDays).toBe(365);
    });

    test('uses 180 days for moderate risk', () => {
      const result = calculateTestingRecommendation([createTestResult()], 'moderate');
      expect(result.intervalDays).toBe(180);
    });

    test('uses 90 days for high risk', () => {
      const result = calculateTestingRecommendation([createTestResult()], 'high');
      expect(result.intervalDays).toBe(90);
    });
  });

  describe('Due Date Calculation', () => {
    test('calculates next due date correctly', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const testDate = new Date(today);
      testDate.setDate(testDate.getDate() - 30); // 30 days ago
      const testDateStr = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;

      const result = calculateTestingRecommendation(
        [createTestResult({ test_date: testDateStr })],
        'high' // 90 day interval
      );

      // Should be due in exactly 60 days (90 - 30)
      expect(result.daysUntilDue).toBe(60);
      expect(result.isOverdue).toBe(false);
      expect(result.isDueSoon).toBe(false);
    });
  });

  describe('Overdue Detection', () => {
    test('detects overdue status', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const testDate = new Date(today);
      testDate.setDate(testDate.getDate() - 100); // 100 days ago
      const testDateStr = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;

      const result = calculateTestingRecommendation(
        [createTestResult({ test_date: testDateStr })],
        'high' // 90 day interval
      );

      expect(result.isOverdue).toBe(true);
      expect(result.daysUntilDue).toBe(-10);
    });
  });

  describe('Due Soon Detection', () => {
    test('detects due within 14 days', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const testDate = new Date(today);
      testDate.setDate(testDate.getDate() - 80); // 80 days ago
      const testDateStr = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;

      const result = calculateTestingRecommendation(
        [createTestResult({ test_date: testDateStr })],
        'high' // 90 day interval
      );

      expect(result.daysUntilDue).toBe(10);
      expect(result.isDueSoon).toBe(true);
      expect(result.isOverdue).toBe(false);
    });

    test('detects due today or just past', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const testDate = new Date(today);
      testDate.setDate(testDate.getDate() - 90); // Exactly 90 days ago
      const testDateStr = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;

      const result = calculateTestingRecommendation(
        [createTestResult({ test_date: testDateStr })],
        'high'
      );

      expect(result.daysUntilDue).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles no risk level', () => {
      const result = calculateTestingRecommendation([createTestResult()], null);

      expect(result.nextDueDate).toBeNull();
      expect(result.daysUntilDue).toBeNull();
      expect(result.isOverdue).toBe(false);
      expect(result.isDueSoon).toBe(false);
      expect(result.intervalDays).toBeNull();
    });

    test('handles no routine results', () => {
      const result = calculateTestingRecommendation(
        [createTestResult({
          test_type: 'Herpes Only',
          sti_results: [{ name: 'HSV-1', result: 'Negative', status: 'negative' }],
        })],
        'high'
      );

      expect(result.nextDueDate).toBeNull();
      expect(result.daysUntilDue).toBeNull();
      expect(result.intervalDays).toBe(90); // Still shows interval for risk level
    });

    test('handles empty results array', () => {
      const result = calculateTestingRecommendation([], 'high');

      expect(result.lastTestDate).toBeNull();
      expect(result.nextDueDate).toBeNull();
    });

    test('uses most recent routine test', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const results = [
        createTestResult({ test_date: '2024-01-15' }),
        createTestResult({ test_date: '2024-02-15' }), // Most recent
        createTestResult({ test_date: '2024-01-01' }),
      ];

      const result = calculateTestingRecommendation(results, 'high');
      expect(result.lastTestDate).toBe('2024-01-15'); // First in array (assumes pre-sorted)
    });
  });
});

describe('formatDueMessage', () => {
  test('returns null when no risk level', () => {
    const rec: TestingRecommendation = {
      lastTestDate: '2024-01-15',
      nextDueDate: null,
      daysUntilDue: null,
      isOverdue: false,
      isDueSoon: false,
      riskLevel: null,
      intervalDays: null,
    };

    expect(formatDueMessage(rec)).toBeNull();
  });

  test('returns null when daysUntilDue is null', () => {
    const rec: TestingRecommendation = {
      lastTestDate: null,
      nextDueDate: null,
      daysUntilDue: null,
      isOverdue: false,
      isDueSoon: false,
      riskLevel: 'high',
      intervalDays: 90,
    };

    expect(formatDueMessage(rec)).toBeNull();
  });

  test('formats overdue message (singular)', () => {
    const rec: TestingRecommendation = {
      lastTestDate: '2024-01-15',
      nextDueDate: '2024-04-14',
      daysUntilDue: -1,
      isOverdue: true,
      isDueSoon: false,
      riskLevel: 'high',
      intervalDays: 90,
    };

    expect(formatDueMessage(rec)).toBe("You're 1 day overdue for testing");
  });

  test('formats overdue message (plural)', () => {
    const rec: TestingRecommendation = {
      lastTestDate: '2024-01-15',
      nextDueDate: '2024-04-14',
      daysUntilDue: -10,
      isOverdue: true,
      isDueSoon: false,
      riskLevel: 'high',
      intervalDays: 90,
    };

    expect(formatDueMessage(rec)).toBe("You're 10 days overdue for testing");
  });

  test('formats due today message', () => {
    const rec: TestingRecommendation = {
      lastTestDate: '2024-01-15',
      nextDueDate: '2024-04-14',
      daysUntilDue: 0,
      isOverdue: false,
      isDueSoon: true,
      riskLevel: 'high',
      intervalDays: 90,
    };

    expect(formatDueMessage(rec)).toBe('Your next test is due today');
  });

  test('formats due soon message (singular)', () => {
    const rec: TestingRecommendation = {
      lastTestDate: '2024-01-15',
      nextDueDate: '2024-04-14',
      daysUntilDue: 1,
      isOverdue: false,
      isDueSoon: true,
      riskLevel: 'high',
      intervalDays: 90,
    };

    expect(formatDueMessage(rec)).toBe('Your next test is due in 1 day');
  });

  test('formats due soon message (plural)', () => {
    const rec: TestingRecommendation = {
      lastTestDate: '2024-01-15',
      nextDueDate: '2024-04-14',
      daysUntilDue: 7,
      isOverdue: false,
      isDueSoon: true,
      riskLevel: 'high',
      intervalDays: 90,
    };

    expect(formatDueMessage(rec)).toBe('Your next test is due in 7 days');
  });

  test('returns null when not overdue and not due soon', () => {
    const rec: TestingRecommendation = {
      lastTestDate: '2024-01-15',
      nextDueDate: '2024-04-14',
      daysUntilDue: 60,
      isOverdue: false,
      isDueSoon: false,
      riskLevel: 'high',
      intervalDays: 90,
    };

    expect(formatDueMessage(rec)).toBeNull();
  });
});

describe('Risk Level Intervals', () => {
  test('low risk = yearly (365 days)', () => {
    expect(INTERVALS.low).toBe(365);
  });

  test('moderate risk = 6 months (180 days)', () => {
    expect(INTERVALS.moderate).toBe(180);
  });

  test('high risk = 3 months (90 days)', () => {
    expect(INTERVALS.high).toBe(90);
  });
});
