/**
 * PHO Bug Fix Validation Test Suite
 *
 * This test suite specifically validates the fix for the bug where
 * Public Health Ontario documents were not being recognized as verified.
 *
 * Tests cover:
 * - PHO variations are now recognized
 * - All existing Canadian labs still work (no regression)
 * - Integration with document verification system
 */

import { normalizeLabName, matchesCanadianLab } from '../../../lib/utils/labNameNormalizer';

describe('PHO Bug Fix - Specific Validation', () => {
  describe('PHO Abbreviation Recognition (Core Bug Fix)', () => {
    test('PHO abbreviation now recognized', () => {
      expect(matchesCanadianLab('PHO')).toBe(true);
      expect(normalizeLabName('PHO')).toBe('public health ontario');
    });

    test('PHO with suffix variations recognized', () => {
      expect(matchesCanadianLab('PHO Laboratory')).toBe(true);
      expect(matchesCanadianLab('PHO Lab')).toBe(true);
      expect(matchesCanadianLab('PHO Medical Laboratory')).toBe(true);
    });

    test('PHO case variations recognized', () => {
      expect(matchesCanadianLab('pho')).toBe(true);
      expect(matchesCanadianLab('Pho')).toBe(true);
      expect(matchesCanadianLab('PHO')).toBe(true);
    });
  });

  describe('Public Health Ontario Full Name Recognition', () => {
    test('full name variations recognized', () => {
      expect(matchesCanadianLab('Public Health Ontario')).toBe(true);
      expect(matchesCanadianLab('Public Health Ontario Laboratory')).toBe(true);
      expect(matchesCanadianLab('PUBLIC HEALTH ONTARIO')).toBe(true);
    });

    test('full name with suffixes recognized', () => {
      expect(matchesCanadianLab('Public Health Ontario Lab')).toBe(true);
      expect(matchesCanadianLab('Public Health Ontario Medical Laboratory')).toBe(true);
    });
  });

  describe('Backward Compatibility - All 11 Canadian Labs Still Recognized', () => {
    const allCanadianLabs = [
      { name: 'LifeLabs', variations: ['LifeLabs', 'LifeLabs Medical Laboratory', 'LIFELABS'] },
      { name: 'Public Health Ontario', variations: ['Public Health Ontario', 'PHO', 'Public Health Ontario Laboratory'] },
      { name: 'Dynacare', variations: ['Dynacare', 'Dynacare Medical Laboratory', 'DYNACARE'] },
      { name: 'BC CDC', variations: ['BC CDC', 'bc cdc', 'BCCDC', 'BC CDC Laboratory'] },
      { name: 'Alberta Precision Labs', variations: ['Alberta Precision Labs', 'APL', 'Alberta Precision Laboratories'] },
      { name: 'Gamma-Dynacare', variations: ['Gamma-Dynacare', 'GAMMA-DYNACARE', 'Gamma-Dynacare Laboratory'] },
      { name: 'MedLabs', variations: ['MedLabs', 'MEDLABS', 'MedLabs Laboratory'] },
      { name: 'Bio-Test', variations: ['Bio-Test', 'BIO-TEST', 'Bio-Test Laboratory'] },
      { name: 'IDEXX', variations: ['IDEXX', 'idexx', 'IDEXX Laboratory'] },
      { name: 'Hassle Free Clinic', variations: ['Hassle Free Clinic', 'HFC', 'HASSLE FREE CLINIC'] },
      { name: 'Mapletree Medical', variations: ['Mapletree Medical', 'MAPLETREE MEDICAL', 'Mapletree Medical Laboratory'] },
    ];

    test('all 11 Canadian labs recognized with variations', () => {
      let totalVariations = 0;
      for (const lab of allCanadianLabs) {
        for (const variation of lab.variations) {
          expect(matchesCanadianLab(variation)).toBe(true);
          totalVariations++;
        }
      }
      // Verify we tested a meaningful number of variations
      expect(totalVariations).toBeGreaterThanOrEqual(33);
    });

    test('no labs accidentally rejected', () => {
      const basicLabNames = [
        'lifelabs', 'public health ontario', 'dynacare', 'bc cdc',
        'alberta precision labs', 'gamma-dynacare', 'medlabs',
        'bio-test', 'idexx', 'hassle free clinic', 'mapletree medical',
      ];

      for (const lab of basicLabNames) {
        expect(matchesCanadianLab(lab)).toBe(true);
      }
      expect(basicLabNames).toHaveLength(11);
    });
  });

  describe('Document Verification Integration', () => {
    // Mock the verification function behavior
    function simulateDocumentVerification(labName: string, hasIdentifier: boolean) {
      const isRecognizedLab = matchesCanadianLab(labName);
      return isRecognizedLab && hasIdentifier;
    }

    test('PHO documents now verify correctly', () => {
      expect(simulateDocumentVerification('PHO', true)).toBe(true);
      expect(simulateDocumentVerification('PHO Laboratory', true)).toBe(true);
      expect(simulateDocumentVerification('Public Health Ontario', true)).toBe(true);
      expect(simulateDocumentVerification('Public Health Ontario Laboratory', true)).toBe(true);
    });

    test('PHO documents still fail without identifier', () => {
      expect(simulateDocumentVerification('PHO', false)).toBe(false);
      expect(simulateDocumentVerification('Public Health Ontario', false)).toBe(false);
    });

    test('other Canadian labs still verify correctly', () => {
      expect(simulateDocumentVerification('LifeLabs', true)).toBe(true);
      expect(simulateDocumentVerification('Dynacare', true)).toBe(true);
      expect(simulateDocumentVerification('Alberta Precision Labs', true)).toBe(true);
    });

    test('unrecognized labs still fail', () => {
      expect(simulateDocumentVerification('Unknown Lab', true)).toBe(false);
      expect(simulateDocumentVerification('Quest Diagnostics', true)).toBe(false);
    });
  });

  describe('Normalization Behavior - PHO Specific', () => {
    test('PHO normalizes to full name', () => {
      expect(normalizeLabName('PHO')).toBe('public health ontario');
      expect(normalizeLabName('pho')).toBe('public health ontario');
    });

    test('PHO with suffixes normalizes correctly', () => {
      expect(normalizeLabName('PHO Laboratory')).toBe('public health ontario');
      expect(normalizeLabName('PHO Medical Lab')).toBe('public health ontario');
    });

    test('full name normalizes consistently', () => {
      expect(normalizeLabName('Public Health Ontario')).toBe('public health ontario');
      expect(normalizeLabName('Public Health Ontario Laboratory')).toBe('public health ontario');
      expect(normalizeLabName('PUBLIC HEALTH ONTARIO LAB')).toBe('public health ontario');
    });
  });

  describe('Edge Cases - PHO Variations from Real-World LLM', () => {
    test('common LLM-generated PHO variations', () => {
      const llmVariations = [
        'PHO',
        'pho',
        'Pho',
        'PHO Laboratory',
        'PHO Lab',
        'Public Health Ontario',
        'Public Health Ontario Laboratory',
        'PUBLIC HEALTH ONTARIO',
        'Public Health Ontario Lab',
        'PHO Medical Laboratory',
        '  PHO  ',
        '  Public Health Ontario  ',
        'Public  Health   Ontario',
      ];

      for (const variation of llmVariations) {
        expect(matchesCanadianLab(variation)).toBe(true);
      }
    });

    test('correctly rejects clearly non-matching inputs', () => {
      // Short strings that don't match
      expect(matchesCanadianLab('PH')).toBe(false);
      expect(matchesCanadianLab('Lab')).toBe(false);
      expect(matchesCanadianLab('Test')).toBe(false);

      // Completely unrelated labs
      expect(matchesCanadianLab('Quest Diagnostics')).toBe(false);
      expect(matchesCanadianLab('LabCorp')).toBe(false);
      expect(matchesCanadianLab('Mayo Clinic')).toBe(false);
    });

    test('partial matches handled by fuzzy matching strategy', () => {
      // Note: The implementation uses flexible matching strategies:
      // - "ontario" (7 chars, >= 6) matches because it's in "public health ontario"
      // - Multi-word needs 80% overlap to match
      // This is intentional to handle LLM extraction variations while preventing false positives

      // Single word >= 6 chars that appears in a lab name will match
      expect(matchesCanadianLab('ontario')).toBe(true); // in "public health ontario"
      expect(matchesCanadianLab('lifelabs')).toBe(true); // exact match

      // Multi-word with insufficient overlap correctly rejects
      // "health ontario" = 2 words, "public health ontario" = 3 words
      // overlap = 2/3 = 66.7% < 80% threshold
      expect(matchesCanadianLab('Health Ontario')).toBe(false);

      // But full or near-full matches work
      expect(matchesCanadianLab('Public Health Ontario')).toBe(true); // 100% overlap
    });

    test('handles lab names with extra text (real-world variations)', () => {
      // Lab name with additional context - these should still match
      expect(matchesCanadianLab('Public Health Ontario - Toronto')).toBe(true);
      expect(matchesCanadianLab('Public Health Ontario Laboratory Services')).toBe(true);
      expect(matchesCanadianLab('LifeLabs Toronto Branch')).toBe(true);
    });
  });

  describe('Performance Regression Check', () => {
    test('normalization remains fast for all variations', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        normalizeLabName('Public Health Ontario Laboratory');
        normalizeLabName('PHO');
        normalizeLabName('LifeLabs Medical Laboratory');
      }

      const duration = performance.now() - start;

      // Should complete 3000 normalizations in under 100ms
      expect(duration).toBeLessThan(100);
    });

    test('matching remains fast for all variations', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        matchesCanadianLab('Public Health Ontario Laboratory');
        matchesCanadianLab('PHO');
        matchesCanadianLab('LifeLabs Medical Laboratory');
      }

      const duration = performance.now() - start;

      // Should complete 3000 matches in under 200ms
      expect(duration).toBeLessThan(200);
    });
  });
});
