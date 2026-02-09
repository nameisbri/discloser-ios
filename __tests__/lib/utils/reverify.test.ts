/**
 * Tests for the reverify utility — specifically for the score recalculation logic.
 *
 * Note: We test the exported matchNames and scoreToLevel functions directly
 * since reverifyNameMatches depends on Supabase and is better tested via
 * integration tests. This file validates the core recalculation logic.
 */

// Mock transitive dependencies that aren't available in Jest
jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mockedhash'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
jest.mock('../../../lib/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));
jest.mock('../../../lib/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../lib/http', () => ({
  isNetworkRequestError: jest.fn(() => false),
}));
jest.mock('../../../lib/parsing/pdfParser', () => ({
  extractTextFromPDF: jest.fn(),
  isPDFExtractionAvailable: jest.fn(() => false),
}));
jest.mock('../../../lib/parsing/ocrExtractor', () => ({
  DocumentParsingError: class extends Error {
    step: string;
    constructor(step: string, message: string) { super(message); this.step = step; }
    getUserMessage() { return this.message; }
  },
  extractTextFromImage: jest.fn(),
}));

import { matchNames, scoreToLevel } from '../../../lib/parsing/documentParser';

describe('matchNames (exported for reverify)', () => {
  it('should match when first and last name appear in extracted name', () => {
    expect(matchNames('John Smith', { first_name: 'John', last_name: 'Smith' })).toBe(true);
  });

  it('should match when names are in reversed order', () => {
    expect(matchNames('Smith, John', { first_name: 'John', last_name: 'Smith' })).toBe(true);
  });

  it('should match with diacritics stripped', () => {
    expect(matchNames('José García', { first_name: 'Jose', last_name: 'Garcia' })).toBe(true);
  });

  it('should not match completely different names', () => {
    expect(matchNames('Jane Doe', { first_name: 'John', last_name: 'Smith' })).toBe(false);
  });

  it('should return false when extractedName is undefined', () => {
    expect(matchNames(undefined, { first_name: 'John', last_name: 'Smith' })).toBe(false);
  });

  it('should return false when profile is undefined', () => {
    expect(matchNames('John Smith', undefined)).toBe(false);
  });

  it('should return false when profile has no names', () => {
    expect(matchNames('John Smith', { first_name: null, last_name: null })).toBe(false);
  });

  it('should match case-insensitively', () => {
    expect(matchNames('JOHN SMITH', { first_name: 'john', last_name: 'smith' })).toBe(true);
  });

  // Simulate a re-verify scenario: user initially had wrong name, then corrected it
  it('should correctly re-evaluate after name correction', () => {
    const extractedName = 'Maria Rodriguez';

    // Before correction: profile has wrong name
    expect(matchNames(extractedName, { first_name: 'John', last_name: 'Smith' })).toBe(false);

    // After correction: profile now has correct name
    expect(matchNames(extractedName, { first_name: 'Maria', last_name: 'Rodriguez' })).toBe(true);
  });
});

describe('scoreToLevel (exported for reverify)', () => {
  it('should return "high" for score >= 75', () => {
    expect(scoreToLevel(75)).toBe('high');
    expect(scoreToLevel(100)).toBe('high');
  });

  it('should return "moderate" for score 50-74', () => {
    expect(scoreToLevel(50)).toBe('moderate');
    expect(scoreToLevel(74)).toBe('moderate');
  });

  it('should return "low" for score 25-49', () => {
    expect(scoreToLevel(25)).toBe('low');
    expect(scoreToLevel(49)).toBe('low');
  });

  it('should return "unverified" for score 1-24', () => {
    expect(scoreToLevel(1)).toBe('unverified');
    expect(scoreToLevel(24)).toBe('unverified');
  });

  it('should return "no_signals" for score 0', () => {
    expect(scoreToLevel(0)).toBe('no_signals');
  });
});

describe('reverify score recalculation logic', () => {
  // Simulates what reverifyNameMatches does without Supabase
  function recalculateWithNewNameMatch(
    checks: Array<{ name: string; passed: boolean; points: number; maxPoints: number; details?: string }>,
    newNameMatched: boolean,
  ) {
    const updatedChecks = checks.map((c) => {
      if (c.name === 'name_match') {
        return {
          ...c,
          passed: newNameMatched,
          points: newNameMatched ? c.maxPoints : 0,
          details: newNameMatched ? 'Patient name matches profile' : 'Patient name does not match profile',
        };
      }
      return c;
    });

    const newScore = updatedChecks.reduce((sum, c) => sum + c.points, 0);
    const newLevel = scoreToLevel(newScore);

    // Re-evaluate hard gates
    const dateCheck = updatedChecks.find((c) => c.name === 'collection_date');
    const hasFutureDate = dateCheck ? !dateCheck.passed && (dateCheck.details?.includes('future') ?? false) : false;
    const newIsVerified = newScore >= 60 && newNameMatched && !hasFutureDate;

    return { score: newScore, level: newLevel, isVerified: newIsVerified, checks: updatedChecks };
  }

  const baseChecks = [
    { name: 'recognized_lab', passed: true, points: 25, maxPoints: 25, details: 'Matched: LifeLabs' },
    { name: 'health_card', passed: true, points: 20, maxPoints: 20, details: 'Health card number detected' },
    { name: 'accession_number', passed: true, points: 15, maxPoints: 15, details: 'Accession matches LifeLabs format' },
    { name: 'name_match', passed: false, points: 0, maxPoints: 15, details: 'Patient name does not match profile' },
    { name: 'collection_date', passed: true, points: 10, maxPoints: 10, details: 'Valid collection date' },
    { name: 'structural_completeness', passed: true, points: 10, maxPoints: 10, details: '5 tests with type "Full STI Panel"' },
    { name: 'multi_signal_agreement', passed: false, points: 0, maxPoints: 5, details: 'Only 2 of 4 verification signals present (need 3+)' },
  ];

  it('should upgrade score when name now matches', () => {
    const result = recalculateWithNewNameMatch(baseChecks, true);
    // Was: 25+20+15+0+10+10+0 = 80, now: 25+20+15+15+10+10+0 = 95
    expect(result.score).toBe(95);
    expect(result.level).toBe('high');
    expect(result.isVerified).toBe(true);
  });

  it('should downgrade score when name no longer matches', () => {
    const checksWithNameMatch = baseChecks.map((c) =>
      c.name === 'name_match' ? { ...c, passed: true, points: 15 } : c
    );
    const result = recalculateWithNewNameMatch(checksWithNameMatch, false);
    // Was: 25+20+15+15+10+10+0 = 95, now: 25+20+15+0+10+10+0 = 80
    expect(result.score).toBe(80);
    expect(result.level).toBe('high');
    // Score >= 60 but nameMatched is false → not verified (hard gate)
    expect(result.isVerified).toBe(false);
  });

  it('should not verify when score is below 60 even with name match', () => {
    const lowChecks = [
      { name: 'recognized_lab', passed: false, points: 0, maxPoints: 25, details: 'Lab not recognized' },
      { name: 'health_card', passed: false, points: 0, maxPoints: 20, details: 'No health card detected' },
      { name: 'accession_number', passed: false, points: 0, maxPoints: 15, details: 'No accession number detected' },
      { name: 'name_match', passed: false, points: 0, maxPoints: 15, details: 'Patient name does not match profile' },
      { name: 'collection_date', passed: true, points: 10, maxPoints: 10, details: 'Valid collection date' },
      { name: 'structural_completeness', passed: true, points: 10, maxPoints: 10, details: '2 tests' },
      { name: 'multi_signal_agreement', passed: false, points: 0, maxPoints: 5, details: '0 of 4 signals' },
    ];
    const result = recalculateWithNewNameMatch(lowChecks, true);
    // 0+0+0+15+10+10+0 = 35
    expect(result.score).toBe(35);
    expect(result.level).toBe('low');
    expect(result.isVerified).toBe(false);
  });

  it('should handle future date hard gate', () => {
    const futureDateChecks = baseChecks.map((c) =>
      c.name === 'collection_date'
        ? { ...c, passed: false, points: 0, details: 'Collection date is in the future' }
        : c
    );
    const result = recalculateWithNewNameMatch(futureDateChecks, true);
    // Even with high score and name match, future date blocks verification
    expect(result.isVerified).toBe(false);
  });
});
