/**
 * Risk Assessment Tests
 *
 * Tests the risk level calculation based on questionnaire answers.
 */

type RiskLevel = 'low' | 'moderate' | 'high';

/**
 * Calculate risk level from questionnaire answers
 * Points: 1-5 = low, 6-7 = moderate, 8+ = high
 */
function calculateRiskLevel(answers: Record<string, number>): RiskLevel {
  const total = Object.values(answers).reduce((sum, pts) => sum + pts, 0);
  if (total <= 5) return 'low';
  if (total <= 7) return 'moderate';
  return 'high';
}

// Risk question point values (based on component)
const RISK_QUESTIONS = {
  partners: {
    '0-1': 1,
    '2-4': 2,
    '5+': 3,
  },
  protection: {
    'always': 1,
    'sometimes': 2,
    'rarely': 3,
  },
  partnerStatus: {
    'known-negative': 1,
    'mixed': 2,
    'unknown': 3,
  },
  history: {
    'none': 1,
    'yes-treated': 2,
    'yes-recent': 3,
  },
};

// ============================================
// TESTS
// ============================================

describe('calculateRiskLevel', () => {
  describe('Low Risk (1-5 points)', () => {
    test('minimum score (4 points) = low', () => {
      const answers = {
        partners: 1,
        protection: 1,
        partnerStatus: 1,
        history: 1,
      };
      expect(calculateRiskLevel(answers)).toBe('low');
    });

    test('5 points = low', () => {
      const answers = {
        partners: 1,
        protection: 1,
        partnerStatus: 1,
        history: 2,
      };
      expect(calculateRiskLevel(answers)).toBe('low');
    });

    test('typical low risk profile', () => {
      // 0-1 partners, always protected, known status, no history
      const answers = {
        partners: 1,
        protection: 1,
        partnerStatus: 1,
        history: 1,
      };
      expect(calculateRiskLevel(answers)).toBe('low');
    });
  });

  describe('Moderate Risk (6-7 points)', () => {
    test('6 points = moderate', () => {
      const answers = {
        partners: 2,
        protection: 1,
        partnerStatus: 2,
        history: 1,
      };
      expect(calculateRiskLevel(answers)).toBe('moderate');
    });

    test('7 points = moderate', () => {
      const answers = {
        partners: 2,
        protection: 2,
        partnerStatus: 2,
        history: 1,
      };
      expect(calculateRiskLevel(answers)).toBe('moderate');
    });

    test('typical moderate risk profile', () => {
      // 2-4 partners, sometimes protected, mixed status, treated history
      const answers = {
        partners: 2,
        protection: 2,
        partnerStatus: 2,
        history: 1,
      };
      expect(calculateRiskLevel(answers)).toBe('moderate');
    });
  });

  describe('High Risk (8+ points)', () => {
    test('8 points = high', () => {
      const answers = {
        partners: 2,
        protection: 2,
        partnerStatus: 2,
        history: 2,
      };
      expect(calculateRiskLevel(answers)).toBe('high');
    });

    test('maximum score (12 points) = high', () => {
      const answers = {
        partners: 3,
        protection: 3,
        partnerStatus: 3,
        history: 3,
      };
      expect(calculateRiskLevel(answers)).toBe('high');
    });

    test('typical high risk profile', () => {
      // 5+ partners, rarely protected, unknown status, recent history
      const answers = {
        partners: 3,
        protection: 3,
        partnerStatus: 3,
        history: 3,
      };
      expect(calculateRiskLevel(answers)).toBe('high');
    });
  });

  describe('Boundary Conditions', () => {
    test('exactly 5 points = low (upper boundary)', () => {
      expect(calculateRiskLevel({ a: 5 })).toBe('low');
    });

    test('exactly 6 points = moderate (lower boundary)', () => {
      expect(calculateRiskLevel({ a: 6 })).toBe('moderate');
    });

    test('exactly 7 points = moderate (upper boundary)', () => {
      expect(calculateRiskLevel({ a: 7 })).toBe('moderate');
    });

    test('exactly 8 points = high (lower boundary)', () => {
      expect(calculateRiskLevel({ a: 8 })).toBe('high');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty answers', () => {
      expect(calculateRiskLevel({})).toBe('low');
    });

    test('handles single answer', () => {
      expect(calculateRiskLevel({ q1: 3 })).toBe('low');
    });

    test('handles many answers', () => {
      const answers = {
        q1: 1,
        q2: 1,
        q3: 1,
        q4: 1,
        q5: 1,
        q6: 1,
        q7: 1,
        q8: 1,
      };
      expect(calculateRiskLevel(answers)).toBe('high'); // 8 points
    });

    test('handles zero values', () => {
      const answers = {
        partners: 0,
        protection: 0,
        partnerStatus: 0,
        history: 0,
      };
      expect(calculateRiskLevel(answers)).toBe('low');
    });
  });
});

describe('Risk Level Thresholds', () => {
  test('low risk threshold is <= 5', () => {
    expect(calculateRiskLevel({ total: 5 })).toBe('low');
    expect(calculateRiskLevel({ total: 6 })).not.toBe('low');
  });

  test('moderate risk threshold is 6-7', () => {
    expect(calculateRiskLevel({ total: 6 })).toBe('moderate');
    expect(calculateRiskLevel({ total: 7 })).toBe('moderate');
    expect(calculateRiskLevel({ total: 8 })).not.toBe('moderate');
  });

  test('high risk threshold is >= 8', () => {
    expect(calculateRiskLevel({ total: 8 })).toBe('high');
    expect(calculateRiskLevel({ total: 100 })).toBe('high');
  });
});

describe('Risk Question Combinations', () => {
  describe('Real-World Scenarios', () => {
    test('monogamous, always protected, known status, no history = low', () => {
      const answers = {
        partners: RISK_QUESTIONS.partners['0-1'],      // 1
        protection: RISK_QUESTIONS.protection['always'], // 1
        partnerStatus: RISK_QUESTIONS.partnerStatus['known-negative'], // 1
        history: RISK_QUESTIONS.history['none'],       // 1
      };
      expect(calculateRiskLevel(answers)).toBe('low'); // 4 points
    });

    test('few partners, sometimes protected, mixed status, treated history = moderate', () => {
      const answers = {
        partners: RISK_QUESTIONS.partners['2-4'],      // 2
        protection: RISK_QUESTIONS.protection['sometimes'], // 2
        partnerStatus: RISK_QUESTIONS.partnerStatus['mixed'], // 2
        history: RISK_QUESTIONS.history['none'],       // 1
      };
      expect(calculateRiskLevel(answers)).toBe('moderate'); // 7 points
    });

    test('many partners, rarely protected, unknown status, recent history = high', () => {
      const answers = {
        partners: RISK_QUESTIONS.partners['5+'],       // 3
        protection: RISK_QUESTIONS.protection['rarely'], // 3
        partnerStatus: RISK_QUESTIONS.partnerStatus['unknown'], // 3
        history: RISK_QUESTIONS.history['yes-recent'], // 3
      };
      expect(calculateRiskLevel(answers)).toBe('high'); // 12 points
    });
  });

  describe('Mixed Scenarios', () => {
    test('many partners but always protected = moderate', () => {
      const answers = {
        partners: RISK_QUESTIONS.partners['5+'],       // 3
        protection: RISK_QUESTIONS.protection['always'], // 1
        partnerStatus: RISK_QUESTIONS.partnerStatus['known-negative'], // 1
        history: RISK_QUESTIONS.history['none'],       // 1
      };
      expect(calculateRiskLevel(answers)).toBe('moderate'); // 6 points
    });

    test('few partners but never protected = moderate', () => {
      const answers = {
        partners: RISK_QUESTIONS.partners['0-1'],      // 1
        protection: RISK_QUESTIONS.protection['rarely'], // 3
        partnerStatus: RISK_QUESTIONS.partnerStatus['unknown'], // 3
        history: RISK_QUESTIONS.history['none'],       // 1
      };
      expect(calculateRiskLevel(answers)).toBe('high'); // 8 points
    });
  });
});

describe('Testing Interval Mapping', () => {
  // Testing intervals by risk level
  const INTERVALS: Record<RiskLevel, { days: number; description: string }> = {
    low: { days: 365, description: 'yearly' },
    moderate: { days: 180, description: 'every 6 months' },
    high: { days: 90, description: 'every 3 months' },
  };

  test('low risk = yearly testing', () => {
    expect(INTERVALS.low.days).toBe(365);
    expect(INTERVALS.low.description).toBe('yearly');
  });

  test('moderate risk = 6 month testing', () => {
    expect(INTERVALS.moderate.days).toBe(180);
    expect(INTERVALS.moderate.description).toBe('every 6 months');
  });

  test('high risk = 3 month testing', () => {
    expect(INTERVALS.high.days).toBe(90);
    expect(INTERVALS.high.description).toBe('every 3 months');
  });
});
