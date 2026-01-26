/**
 * Dashboard Data Fetching Tests
 *
 * Tests the parallel data fetching and deduplication logic for the dashboard.
 * This test focuses on the request deduplication mechanism and data computation logic.
 */

import type { TestResult, Profile, Reminder, TestStatus, RiskLevel, KnownCondition } from "../../../lib/types";

// ============================================
// REQUEST DEDUPLICATION TESTS
// ============================================

/**
 * Simplified Request Deduplicator for testing
 * Matches the implementation in useDashboardData
 */
class RequestDeduplicator {
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.inFlightRequests.clear();
  }

  getInFlightCount(): number {
    return this.inFlightRequests.size;
  }
}

describe("RequestDeduplicator", () => {
  let deduplicator: RequestDeduplicator;

  beforeEach(() => {
    deduplicator = new RequestDeduplicator();
  });

  test("executes single request normally", async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      return "result";
    };

    const result = await deduplicator.deduplicate("key1", requestFn);

    expect(result).toBe("result");
    expect(callCount).toBe(1);
  });

  test("deduplicates concurrent requests with same key", async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `result-${callCount}`;
    };

    // Make 3 concurrent requests with same key
    const promises = [
      deduplicator.deduplicate("key1", requestFn),
      deduplicator.deduplicate("key1", requestFn),
      deduplicator.deduplicate("key1", requestFn),
    ];

    const results = await Promise.all(promises);

    // Should only execute once
    expect(callCount).toBe(1);
    // All results should be the same
    expect(results).toEqual(["result-1", "result-1", "result-1"]);
  });

  test("allows concurrent requests with different keys", async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return callCount;
    };

    // Make concurrent requests with different keys
    const promises = [
      deduplicator.deduplicate("key1", requestFn),
      deduplicator.deduplicate("key2", requestFn),
      deduplicator.deduplicate("key3", requestFn),
    ];

    await Promise.all(promises);

    // Should execute once per key
    expect(callCount).toBe(3);
  });

  test("clears in-flight requests after completion", async () => {
    const requestFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "result";
    };

    expect(deduplicator.getInFlightCount()).toBe(0);

    const promise = deduplicator.deduplicate("key1", requestFn);
    expect(deduplicator.getInFlightCount()).toBe(1);

    await promise;
    expect(deduplicator.getInFlightCount()).toBe(0);
  });

  test("allows sequential requests with same key", async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      return callCount;
    };

    // First request
    const result1 = await deduplicator.deduplicate("key1", requestFn);
    expect(result1).toBe(1);

    // Second request (after first completes)
    const result2 = await deduplicator.deduplicate("key1", requestFn);
    expect(result2).toBe(2);

    expect(callCount).toBe(2);
  });

  test("handles request errors without breaking deduplication", async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      throw new Error("Request failed");
    };

    // First request should fail
    await expect(deduplicator.deduplicate("key1", requestFn)).rejects.toThrow("Request failed");

    // Second request should execute (not deduplicated since first failed)
    await expect(deduplicator.deduplicate("key1", requestFn)).rejects.toThrow("Request failed");

    expect(callCount).toBe(2);
    expect(deduplicator.getInFlightCount()).toBe(0);
  });
});

// ============================================
// STI STATUS COMPUTATION TESTS
// ============================================

/**
 * Testing intervals in days by risk level
 */
const TESTING_INTERVALS: Record<RiskLevel, number> = {
  low: 365,      // 12 months
  moderate: 180, // 6 months
  high: 90,      // 3 months
};

const ROUTINE_TESTS = ["chlamydia", "gonorrhea", "hiv", "syphilis"];
const ROUTINE_PANEL_KEYWORDS = ["basic", "full", "std", "sti", "routine", "panel", "4-test"];

function hasRoutineTests(result: TestResult): boolean {
  const hasRoutineSTI = result.sti_results?.some((sti) =>
    ROUTINE_TESTS.some((routine) => sti.name.toLowerCase().includes(routine))
  );
  if (hasRoutineSTI) return true;

  const testType = result.test_type?.toLowerCase() || "";
  return ROUTINE_PANEL_KEYWORDS.some((kw) => testType.includes(kw));
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

function computeTestingRecommendation(
  results: TestResult[],
  profile: Profile | null
): TestingRecommendation {
  const riskLevel = profile?.risk_level || null;
  const routineResults = results.filter(hasRoutineTests);

  if (!riskLevel || routineResults.length === 0) {
    return {
      lastTestDate: routineResults[0]?.test_date || null,
      nextDueDate: null,
      daysUntilDue: null,
      isOverdue: false,
      isDueSoon: false,
      riskLevel,
      intervalDays: riskLevel ? TESTING_INTERVALS[riskLevel] : null,
    };
  }

  const lastTestDate = routineResults[0].test_date;
  const intervalDays = TESTING_INTERVALS[riskLevel];

  const lastDate = new Date(lastTestDate);
  const nextDue = new Date(lastDate);
  nextDue.setDate(nextDue.getDate() + intervalDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDue.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    lastTestDate,
    nextDueDate: nextDue.toISOString().split("T")[0],
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
    isDueSoon: daysUntilDue >= 0 && daysUntilDue <= 14,
    riskLevel,
    intervalDays,
  };
}

// Helper to create test results
function createTestResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    id: "test-id",
    user_id: "user-id",
    test_date: "2024-01-15",
    status: "negative",
    test_type: "Full STI Panel",
    sti_results: [],
    file_url: null,
    file_name: null,
    notes: null,
    is_verified: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-123",
    first_name: "Test",
    last_name: "User",
    alias: null,
    date_of_birth: "1990-01-01",
    pronouns: "they/them",
    display_name: "Test User",
    risk_level: "moderate",
    risk_assessed_at: "2024-01-01T00:00:00Z",
    known_conditions: [],
    onboarding_completed: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("hasRoutineTests", () => {
  test("identifies routine tests from sti_results", () => {
    const result = createTestResult({
      sti_results: [
        { name: "Chlamydia", result: "Negative", status: "negative" },
        { name: "Gonorrhea", result: "Negative", status: "negative" },
      ],
    });

    expect(hasRoutineTests(result)).toBe(true);
  });

  test("identifies routine tests from test_type", () => {
    const result = createTestResult({
      test_type: "Full STI Panel",
      sti_results: [],
    });

    expect(hasRoutineTests(result)).toBe(true);
  });

  test("returns false for non-routine tests", () => {
    const result = createTestResult({
      test_type: "Pregnancy Test",
      sti_results: [
        { name: "Pregnancy", result: "Negative", status: "negative" },
      ],
    });

    expect(hasRoutineTests(result)).toBe(false);
  });

  test("handles empty sti_results", () => {
    const result = createTestResult({
      test_type: "Other Test",
      sti_results: [],
    });

    expect(hasRoutineTests(result)).toBe(false);
  });

  test("handles null sti_results", () => {
    const result = createTestResult({
      test_type: "Other Test",
      sti_results: null as any,
    });

    expect(hasRoutineTests(result)).toBe(false);
  });
});

describe("computeTestingRecommendation", () => {
  describe("With Risk Level and Routine Tests", () => {
    test("calculates next test date for moderate risk (180 days)", () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 90); // 90 days ago

      const results = [
        createTestResult({
          test_date: testDate.toISOString().split("T")[0],
          sti_results: [
            { name: "HIV", result: "Negative", status: "negative" },
          ],
        }),
      ];

      const profile = createProfile({ risk_level: "moderate" });
      const recommendation = computeTestingRecommendation(results, profile);

      expect(recommendation.riskLevel).toBe("moderate");
      expect(recommendation.intervalDays).toBe(180);
      expect(recommendation.lastTestDate).toBe(testDate.toISOString().split("T")[0]);
      expect(recommendation.nextDueDate).toBeTruthy();
      expect(recommendation.daysUntilDue).toBeLessThan(180);
      expect(recommendation.isOverdue).toBe(false);
    });

    test("calculates next test date for high risk (90 days)", () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 30); // 30 days ago

      const results = [
        createTestResult({
          test_date: testDate.toISOString().split("T")[0],
          sti_results: [
            { name: "HIV", result: "Negative", status: "negative" },
          ],
        }),
      ];

      const profile = createProfile({ risk_level: "high" });
      const recommendation = computeTestingRecommendation(results, profile);

      expect(recommendation.riskLevel).toBe("high");
      expect(recommendation.intervalDays).toBe(90);
    });

    test("calculates next test date for low risk (365 days)", () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 100); // 100 days ago

      const results = [
        createTestResult({
          test_date: testDate.toISOString().split("T")[0],
          sti_results: [
            { name: "HIV", result: "Negative", status: "negative" },
          ],
        }),
      ];

      const profile = createProfile({ risk_level: "low" });
      const recommendation = computeTestingRecommendation(results, profile);

      expect(recommendation.riskLevel).toBe("low");
      expect(recommendation.intervalDays).toBe(365);
    });

    test("identifies overdue tests", () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 200); // 200 days ago (past 180-day interval)

      const results = [
        createTestResult({
          test_date: testDate.toISOString().split("T")[0],
          sti_results: [
            { name: "HIV", result: "Negative", status: "negative" },
          ],
        }),
      ];

      const profile = createProfile({ risk_level: "moderate" });
      const recommendation = computeTestingRecommendation(results, profile);

      expect(recommendation.isOverdue).toBe(true);
      expect(recommendation.daysUntilDue).toBeLessThan(0);
    });

    test("identifies tests due soon (within 14 days)", () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 170); // 170 days ago (10 days until due)

      const results = [
        createTestResult({
          test_date: testDate.toISOString().split("T")[0],
          sti_results: [
            { name: "HIV", result: "Negative", status: "negative" },
          ],
        }),
      ];

      const profile = createProfile({ risk_level: "moderate" });
      const recommendation = computeTestingRecommendation(results, profile);

      expect(recommendation.isDueSoon).toBe(true);
      expect(recommendation.daysUntilDue).toBeGreaterThan(0);
      expect(recommendation.daysUntilDue).toBeLessThanOrEqual(14);
    });
  });

  describe("Without Risk Level or Tests", () => {
    test("handles no risk level set", () => {
      const results = [
        createTestResult({
          sti_results: [
            { name: "HIV", result: "Negative", status: "negative" },
          ],
        }),
      ];

      const profile = createProfile({ risk_level: null });
      const recommendation = computeTestingRecommendation(results, profile);

      expect(recommendation.riskLevel).toBeNull();
      expect(recommendation.nextDueDate).toBeNull();
      expect(recommendation.daysUntilDue).toBeNull();
      expect(recommendation.isOverdue).toBe(false);
      expect(recommendation.isDueSoon).toBe(false);
    });

    test("handles no routine test results", () => {
      const results = [
        createTestResult({
          test_type: "Pregnancy Test",
          sti_results: [],
        }),
      ];

      const profile = createProfile({ risk_level: "moderate" });
      const recommendation = computeTestingRecommendation(results, profile);

      expect(recommendation.nextDueDate).toBeNull();
      expect(recommendation.lastTestDate).toBeNull();
    });

    test("handles empty results array", () => {
      const profile = createProfile({ risk_level: "moderate" });
      const recommendation = computeTestingRecommendation([], profile);

      expect(recommendation.nextDueDate).toBeNull();
      expect(recommendation.lastTestDate).toBeNull();
    });

    test("handles null profile", () => {
      const results = [
        createTestResult({
          sti_results: [
            { name: "HIV", result: "Negative", status: "negative" },
          ],
        }),
      ];

      const recommendation = computeTestingRecommendation(results, null);

      expect(recommendation.riskLevel).toBeNull();
      expect(recommendation.nextDueDate).toBeNull();
    });
  });

  describe("Only Routine Tests Considered", () => {
    test("uses only routine tests for calculation", () => {
      const routineDate = new Date();
      routineDate.setDate(routineDate.getDate() - 100);

      const nonRoutineDate = new Date();
      nonRoutineDate.setDate(nonRoutineDate.getDate() - 10);

      const results = [
        createTestResult({
          test_date: nonRoutineDate.toISOString().split("T")[0],
          test_type: "Pregnancy Test",
          sti_results: [],
        }),
        createTestResult({
          test_date: routineDate.toISOString().split("T")[0],
          sti_results: [
            { name: "HIV", result: "Negative", status: "negative" },
          ],
        }),
      ];

      const profile = createProfile({ risk_level: "moderate" });
      const recommendation = computeTestingRecommendation(results, profile);

      // Should use the routine test date (100 days ago), not the non-routine test
      expect(recommendation.lastTestDate).toBe(routineDate.toISOString().split("T")[0]);
    });
  });
});

// ============================================
// REMINDER FILTERING TESTS
// ============================================

function createReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: "reminder-1",
    user_id: "user-123",
    title: "Next STI Test",
    frequency: "quarterly",
    next_date: "2024-04-15",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("Reminder Filtering", () => {
  test("filters active reminders", () => {
    const reminders = [
      createReminder({ id: "1", is_active: true }),
      createReminder({ id: "2", is_active: false }),
      createReminder({ id: "3", is_active: true }),
    ];

    const activeReminders = reminders.filter((r) => r.is_active);

    expect(activeReminders).toHaveLength(2);
    expect(activeReminders.every((r) => r.is_active)).toBe(true);
  });

  test("identifies next upcoming reminder", () => {
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 10);

    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 30);

    const reminders = [
      createReminder({
        id: "1",
        next_date: futureDate1.toISOString().split("T")[0],
        is_active: true,
      }),
      createReminder({
        id: "2",
        next_date: futureDate2.toISOString().split("T")[0],
        is_active: true,
      }),
    ];

    // Sort by date (ascending) and find first active future reminder
    const sortedReminders = [...reminders].sort(
      (a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime()
    );

    const nextReminder = sortedReminders.find(
      (r) => r.is_active && new Date(r.next_date) > new Date()
    );

    expect(nextReminder?.id).toBe("1");
  });

  test("identifies overdue reminder", () => {
    const pastDate1 = new Date();
    pastDate1.setDate(pastDate1.getDate() - 5);

    const pastDate2 = new Date();
    pastDate2.setDate(pastDate2.getDate() - 10);

    const reminders = [
      createReminder({
        id: "1",
        next_date: pastDate1.toISOString().split("T")[0],
        is_active: true,
      }),
      createReminder({
        id: "2",
        next_date: pastDate2.toISOString().split("T")[0],
        is_active: true,
      }),
    ];

    // Sort by date (ascending) and find first active past reminder
    const sortedReminders = [...reminders].sort(
      (a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime()
    );

    const overdueReminder = sortedReminders.find(
      (r) => r.is_active && new Date(r.next_date) <= new Date()
    );

    expect(overdueReminder?.id).toBe("2"); // Earliest overdue
  });

  test("handles no future reminders", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const reminders = [
      createReminder({
        next_date: pastDate.toISOString().split("T")[0],
        is_active: true,
      }),
    ];

    const nextReminder = reminders.find(
      (r) => r.is_active && new Date(r.next_date) > new Date()
    );

    expect(nextReminder).toBeUndefined();
  });

  test("handles no overdue reminders", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const reminders = [
      createReminder({
        next_date: futureDate.toISOString().split("T")[0],
        is_active: true,
      }),
    ];

    const overdueReminder = reminders.find(
      (r) => r.is_active && new Date(r.next_date) <= new Date()
    );

    expect(overdueReminder).toBeUndefined();
  });

  test("excludes inactive reminders from next/overdue detection", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const reminders = [
      createReminder({
        next_date: futureDate.toISOString().split("T")[0],
        is_active: false, // Inactive
      }),
    ];

    const nextReminder = reminders.find(
      (r) => r.is_active && new Date(r.next_date) > new Date()
    );

    expect(nextReminder).toBeUndefined();
  });
});

// ============================================
// PARALLEL FETCHING BENEFITS TEST
// ============================================

describe("Parallel Fetching Performance", () => {
  test("parallel execution is faster than sequential", async () => {
    // Simulate 3 independent queries that each take 100ms
    const query1 = () => new Promise((resolve) => setTimeout(() => resolve("data1"), 100));
    const query2 = () => new Promise((resolve) => setTimeout(() => resolve("data2"), 100));
    const query3 = () => new Promise((resolve) => setTimeout(() => resolve("data3"), 100));

    // Sequential execution
    const sequentialStart = Date.now();
    await query1();
    await query2();
    await query3();
    const sequentialDuration = Date.now() - sequentialStart;

    // Parallel execution
    const parallelStart = Date.now();
    await Promise.all([query1(), query2(), query3()]);
    const parallelDuration = Date.now() - parallelStart;

    // Parallel should be significantly faster (< 50% of sequential time)
    expect(parallelDuration).toBeLessThan(sequentialDuration * 0.5);
    expect(sequentialDuration).toBeGreaterThanOrEqual(300); // At least 3 * 100ms
    expect(parallelDuration).toBeLessThan(200); // Should be close to 100ms
  });

  test("parallel execution with Promise.all completes all queries", async () => {
    const results: string[] = [];

    const query1 = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      results.push("query1");
      return "data1";
    };

    const query2 = async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      results.push("query2");
      return "data2";
    };

    const query3 = async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      results.push("query3");
      return "data3";
    };

    const [data1, data2, data3] = await Promise.all([query1(), query2(), query3()]);

    expect(data1).toBe("data1");
    expect(data2).toBe("data2");
    expect(data3).toBe("data3");
    expect(results).toHaveLength(3);
    expect(results).toContain("query1");
    expect(results).toContain("query2");
    expect(results).toContain("query3");
  });
});
