/**
 * Verification Scoring Engine Tests
 *
 * Tests the calculateVerificationScore function with various combinations
 * of verification signals and edge cases.
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
jest.mock('../../../lib/parsing/llmParser', () => ({
  parseDocumentWithLLM: jest.fn(),
}));

import { calculateVerificationScore } from '../../../lib/parsing/documentParser';
import type { LLMResponse, UserProfileForVerification } from '../../../lib/parsing/types';

// Helper to build a minimal LLM response
function makeLLM(overrides: Partial<LLMResponse> = {}): LLMResponse {
  return {
    collection_date: '2024-06-15',
    test_type: 'Full STI Panel',
    tests: [
      { name: 'HIV', result: 'Negative' },
      { name: 'Syphilis', result: 'Negative' },
    ],
    ...overrides,
  };
}

const userProfile: UserProfileForVerification = {
  first_name: 'John',
  last_name: 'Smith',
};

describe('calculateVerificationScore', () => {
  describe('Score Levels', () => {
    test('returns high level for score >= 75', () => {
      // recognized_lab(25) + health_card(20) + accession(15) + name_match(15) + date(10) + structural(10) + multi_signal(5) = 100
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'LifeLabs',
          health_card_present: true,
          accession_number: 'L12345678',
          patient_name: 'John Smith',
        }),
        userProfile,
      );
      expect(result.level).toBe('high');
      expect(result.score).toBe(100);
      expect(result.isVerified).toBe(true);
    });

    test('returns moderate level for score 50-74', () => {
      // recognized_lab(25) + health_card(20) + date(10) + structural(10) = 65
      // No user profile provided, so name check is skipped → isVerified = true
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'LifeLabs',
          health_card_present: true,
        }),
      );
      expect(result.level).toBe('moderate');
      expect(result.score).toBe(65);
      expect(result.isVerified).toBe(true);
    });

    test('returns low level for score 25-49', () => {
      // recognized_lab(25) + date(10) + structural(10) = 45
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'LifeLabs',
        }),
      );
      expect(result.level).toBe('low');
      expect(result.score).toBe(45);
      expect(result.isVerified).toBe(false);
    });

    test('returns unverified level for score 1-24', () => {
      // date(10) + structural(10) = 20
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'Unknown Lab',
        }),
      );
      expect(result.level).toBe('unverified');
      expect(result.score).toBe(20);
      expect(result.isVerified).toBe(false);
    });

    test('returns no_signals level for score 0', () => {
      const result = calculateVerificationScore({
        collection_date: null,
        tests: [],
      });
      expect(result.level).toBe('no_signals');
      expect(result.score).toBe(0);
      expect(result.isVerified).toBe(false);
    });
  });

  describe('Individual Checks', () => {
    test('recognized_lab check: awards 25 points for recognized lab', () => {
      const result = calculateVerificationScore(makeLLM({ lab_name: 'LifeLabs' }));
      const check = result.checks.find((c) => c.name === 'recognized_lab');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(25);
      expect(check?.maxPoints).toBe(25);
      expect(check?.details).toContain('LifeLabs');
    });

    test('recognized_lab check: awards 0 for unrecognized lab', () => {
      const result = calculateVerificationScore(makeLLM({ lab_name: 'Unknown Lab' }));
      const check = result.checks.find((c) => c.name === 'recognized_lab');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
    });

    test('health_card check: awards 20 points when present', () => {
      const result = calculateVerificationScore(makeLLM({ health_card_present: true }));
      const check = result.checks.find((c) => c.name === 'health_card');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(20);
    });

    test('health_card check: awards 0 when absent', () => {
      const result = calculateVerificationScore(makeLLM({ health_card_present: false }));
      const check = result.checks.find((c) => c.name === 'health_card');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
    });

    test('accession_number check: awards 15 points when format matches recognized lab', () => {
      const result = calculateVerificationScore(makeLLM({ lab_name: 'LifeLabs', accession_number: 'L12345678' }));
      const check = result.checks.find((c) => c.name === 'accession_number');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(15);
      expect(check?.details).toContain('matches LifeLabs format');
    });

    test('accession_number check: awards 8 points when present but format unverified', () => {
      const result = calculateVerificationScore(makeLLM({ accession_number: 'ACC-123' }));
      const check = result.checks.find((c) => c.name === 'accession_number');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(8);
    });

    test('accession_number check: awards 8 points when format does not match recognized lab', () => {
      const result = calculateVerificationScore(makeLLM({ lab_name: 'LifeLabs', accession_number: 'XYZ-999' }));
      const check = result.checks.find((c) => c.name === 'accession_number');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(8);
      expect(check?.details).toContain("doesn't match");
    });

    test('accession_number check: awards 0 when absent', () => {
      const result = calculateVerificationScore(makeLLM({}));
      const check = result.checks.find((c) => c.name === 'accession_number');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
    });

    test('name_match check: awards 15 points when matched', () => {
      const result = calculateVerificationScore(
        makeLLM({ patient_name: 'John Smith' }),
        userProfile,
      );
      const check = result.checks.find((c) => c.name === 'name_match');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(15);
    });

    test('name_match check: awards 0 when not matched', () => {
      const result = calculateVerificationScore(
        makeLLM({ patient_name: 'Jane Doe' }),
        userProfile,
      );
      const check = result.checks.find((c) => c.name === 'name_match');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
    });

    test('name_match check: awards 0 when no profile', () => {
      const result = calculateVerificationScore(
        makeLLM({ patient_name: 'John Smith' }),
      );
      const check = result.checks.find((c) => c.name === 'name_match');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
      expect(check?.details).toContain('No user profile');
    });

    test('collection_date check: awards 10 for valid date', () => {
      const result = calculateVerificationScore(makeLLM({ collection_date: '2024-06-15' }));
      const check = result.checks.find((c) => c.name === 'collection_date');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(10);
    });

    test('collection_date check: awards 0 for null date', () => {
      const result = calculateVerificationScore(makeLLM({ collection_date: null }));
      const check = result.checks.find((c) => c.name === 'collection_date');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
    });

    test('collection_date check: awards 0 for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      const result = calculateVerificationScore(makeLLM({ collection_date: futureDateStr }));
      const check = result.checks.find((c) => c.name === 'collection_date');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
    });

    test('structural_completeness check: awards 10 when tests and type present', () => {
      const result = calculateVerificationScore(makeLLM({
        test_type: 'Full STI Panel',
        tests: [{ name: 'HIV', result: 'Negative' }],
      }));
      const check = result.checks.find((c) => c.name === 'structural_completeness');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(10);
    });

    test('structural_completeness check: awards 0 when tests empty', () => {
      const result = calculateVerificationScore(makeLLM({ tests: [] }));
      const check = result.checks.find((c) => c.name === 'structural_completeness');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
    });

    test('multi_signal_agreement check: awards 5 when 3+ signals present', () => {
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'LifeLabs',
          health_card_present: true,
          accession_number: 'ACC123',
          patient_name: 'John Smith',
        }),
        userProfile,
      );
      const check = result.checks.find((c) => c.name === 'multi_signal_agreement');
      expect(check?.passed).toBe(true);
      expect(check?.points).toBe(5);
    });

    test('multi_signal_agreement check: awards 0 when < 3 signals', () => {
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'LifeLabs',
          health_card_present: true,
        }),
      );
      const check = result.checks.find((c) => c.name === 'multi_signal_agreement');
      expect(check?.passed).toBe(false);
      expect(check?.points).toBe(0);
    });
  });

  describe('Backward Compatibility', () => {
    test('isVerified true when score >= 60 and no profile', () => {
      // recognized_lab(25) + health_card(20) + date(10) + structural(10) = 65
      const result = calculateVerificationScore(
        makeLLM({ lab_name: 'LifeLabs', health_card_present: true }),
      );
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.isVerified).toBe(true);
    });

    test('isVerified false when score < 60', () => {
      // recognized_lab(25) + date(10) + structural(10) = 45
      const result = calculateVerificationScore(
        makeLLM({ lab_name: 'LifeLabs' }),
      );
      expect(result.score).toBeLessThan(60);
      expect(result.isVerified).toBe(false);
    });

    test('isVerified false when score >= 60 but name does not match profile', () => {
      // recognized_lab(25) + health_card(20) + accession(15) + date(10) + structural(10) + multi(5) = 85
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'LifeLabs',
          health_card_present: true,
          accession_number: 'L12345678',
          patient_name: 'Jane Doe',
        }),
        userProfile,
      );
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.isVerified).toBe(false);
    });

    test('isVerified true when score >= 60 and name matches profile', () => {
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'LifeLabs',
          health_card_present: true,
          patient_name: 'John Smith',
        }),
        userProfile,
      );
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.isVerified).toBe(true);
    });

    test('isVerified false when score >= 60 but collection date is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      const result = calculateVerificationScore(
        makeLLM({
          lab_name: 'LifeLabs',
          health_card_present: true,
          accession_number: 'L12345678',
          patient_name: 'John Smith',
          collection_date: futureDateStr,
        }),
        userProfile,
      );
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.isVerified).toBe(false);
    });
  });

  describe('Check Array Structure', () => {
    test('returns exactly 7 checks', () => {
      const result = calculateVerificationScore(makeLLM({}));
      expect(result.checks).toHaveLength(7);
    });

    test('all checks have required fields', () => {
      const result = calculateVerificationScore(makeLLM({}));
      for (const check of result.checks) {
        expect(check.name).toBeDefined();
        expect(typeof check.passed).toBe('boolean');
        expect(typeof check.points).toBe('number');
        expect(typeof check.maxPoints).toBe('number');
        expect(check.points).toBeLessThanOrEqual(check.maxPoints);
        expect(check.points).toBeGreaterThanOrEqual(0);
      }
    });

    test('total max points equals 100', () => {
      const result = calculateVerificationScore(makeLLM({}));
      const totalMax = result.checks.reduce((sum, c) => sum + c.maxPoints, 0);
      expect(totalMax).toBe(100);
    });
  });

  describe('Lab Database Integration', () => {
    test('recognizes labs from new database (PHO)', () => {
      const result = calculateVerificationScore(makeLLM({ lab_name: 'PHO' }));
      const check = result.checks.find((c) => c.name === 'recognized_lab');
      expect(check?.passed).toBe(true);
      expect(check?.details).toContain('Public Health Ontario');
    });

    test('recognizes labs from new database (Dynacare)', () => {
      const result = calculateVerificationScore(makeLLM({ lab_name: 'Dynacare Medical Laboratory' }));
      const check = result.checks.find((c) => c.name === 'recognized_lab');
      expect(check?.passed).toBe(true);
    });

    test('recognizes labs from new database (BCCDC)', () => {
      const result = calculateVerificationScore(makeLLM({ lab_name: 'BCCDC' }));
      const check = result.checks.find((c) => c.name === 'recognized_lab');
      expect(check?.passed).toBe(true);
    });

    test('recognizes labs from new database (Biron)', () => {
      const result = calculateVerificationScore(makeLLM({ lab_name: 'Biron Health Group' }));
      const check = result.checks.find((c) => c.name === 'recognized_lab');
      expect(check?.passed).toBe(true);
    });
  });
});
