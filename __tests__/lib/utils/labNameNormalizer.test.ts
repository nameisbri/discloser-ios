/**
 * Lab Name Normalizer Tests
 *
 * Comprehensive test suite covering normalization, abbreviation expansion,
 * suffix removal, and Canadian lab matching functionality.
 */

import { normalizeLabName, matchesCanadianLab } from '../../../lib/utils/labNameNormalizer';

describe('normalizeLabName', () => {
  describe('Basic Normalization', () => {
    test('converts to lowercase', () => {
      expect(normalizeLabName('LIFELABS')).toBe('lifelabs');
      expect(normalizeLabName('LifeLabs')).toBe('lifelabs');
      expect(normalizeLabName('Public Health Ontario')).toBe('public health ontario');
    });

    test('trims whitespace', () => {
      expect(normalizeLabName('  lifelabs  ')).toBe('lifelabs');
      expect(normalizeLabName('\tlifelabs\n')).toBe('lifelabs');
      expect(normalizeLabName('   Public Health Ontario   ')).toBe('public health ontario');
    });

    test('collapses multiple spaces to single space', () => {
      expect(normalizeLabName('public  health   ontario')).toBe('public health ontario');
      expect(normalizeLabName('alberta   precision    labs')).toBe('alberta precision labs');
    });

    test('handles empty and whitespace-only strings', () => {
      expect(normalizeLabName('')).toBe('');
      expect(normalizeLabName('   ')).toBe('');
      expect(normalizeLabName('\t\n')).toBe('');
    });
  });

  describe('Suffix Removal', () => {
    test('removes "laboratory" suffix', () => {
      expect(normalizeLabName('Public Health Ontario Laboratory')).toBe('public health ontario');
      expect(normalizeLabName('LifeLabs Laboratory')).toBe('lifelabs');
    });

    test('removes "medical laboratory" suffix', () => {
      expect(normalizeLabName('LifeLabs Medical Laboratory')).toBe('lifelabs');
      expect(normalizeLabName('Dynacare Medical Laboratory')).toBe('dynacare');
    });

    test('removes "lab" suffix', () => {
      expect(normalizeLabName('LifeLabs Lab')).toBe('lifelabs');
      expect(normalizeLabName('Dynacare Medical Lab')).toBe('dynacare');
    });

    test('converts "laboratories" to "labs"', () => {
      // "laboratories" is converted to "labs" rather than removed
      // This helps "Alberta Precision Laboratories" match "alberta precision labs"
      expect(normalizeLabName('Alberta Precision Laboratories')).toBe('alberta precision labs');
      expect(normalizeLabName('MedLabs Laboratories')).toBe('medlabs labs');
    });

    test('removes corporate suffixes', () => {
      expect(normalizeLabName('LifeLabs Inc')).toBe('lifelabs');
      expect(normalizeLabName('Dynacare Incorporated')).toBe('dynacare');
      expect(normalizeLabName('MedLabs Ltd')).toBe('medlabs');
      expect(normalizeLabName('Bio-Test Limited')).toBe('bio-test');
    });

    test('removes longest matching suffix first', () => {
      expect(normalizeLabName('LifeLabs Medical Laboratory Inc')).toBe('lifelabs');
    });

    test('does not remove suffix if it is part of the lab name', () => {
      // "laboratories" is removed as suffix, but if it's the whole name, we get empty
      // This is expected behavior - the suffix removal is greedy
      expect(normalizeLabName('MedLabs')).toBe('medlabs');
    });
  });

  describe('Abbreviation Expansion', () => {
    test('expands PHO to public health ontario', () => {
      expect(normalizeLabName('PHO')).toBe('public health ontario');
      expect(normalizeLabName('pho')).toBe('public health ontario');
      expect(normalizeLabName('Pho')).toBe('public health ontario');
    });

    test('expands APL to alberta precision labs', () => {
      expect(normalizeLabName('APL')).toBe('alberta precision labs');
      expect(normalizeLabName('apl')).toBe('alberta precision labs');
    });

    test('expands BCCDC to bc cdc', () => {
      expect(normalizeLabName('BCCDC')).toBe('bc cdc');
      expect(normalizeLabName('bccdc')).toBe('bc cdc');
    });

    test('expands HFC to hassle free clinic', () => {
      expect(normalizeLabName('HFC')).toBe('hassle free clinic');
      expect(normalizeLabName('hfc')).toBe('hassle free clinic');
    });

    test('abbreviation expansion works with suffixes', () => {
      expect(normalizeLabName('PHO Laboratory')).toBe('public health ontario');
      expect(normalizeLabName('APL Medical Lab')).toBe('alberta precision labs');
    });
  });

  describe('Complex Cases', () => {
    test('handles combination of all normalizations', () => {
      expect(normalizeLabName('  PUBLIC  HEALTH   ONTARIO  LABORATORY  '))
        .toBe('public health ontario');
      expect(normalizeLabName('  LIFELABS   Medical   Laboratory   Inc  '))
        .toBe('lifelabs');
    });

    test('preserves hyphenated names', () => {
      expect(normalizeLabName('Gamma-Dynacare')).toBe('gamma-dynacare');
      expect(normalizeLabName('Bio-Test Laboratory')).toBe('bio-test');
    });

    test('handles names with special characters', () => {
      expect(normalizeLabName('Bio-Test Medical Laboratory')).toBe('bio-test');
    });
  });
});

describe('matchesCanadianLab', () => {
  describe('Acceptance Criteria - Required Matches', () => {
    test('matches "Public Health Ontario Laboratory" to "public health ontario"', () => {
      expect(matchesCanadianLab('Public Health Ontario Laboratory')).toBe(true);
    });

    test('matches "LifeLabs Medical Laboratory" to "lifelabs"', () => {
      expect(matchesCanadianLab('LifeLabs Medical Laboratory')).toBe(true);
    });

    test('matches "PHO" to "public health ontario"', () => {
      expect(matchesCanadianLab('PHO')).toBe(true);
    });

    test('case-insensitive matching works', () => {
      expect(matchesCanadianLab('LIFELABS')).toBe(true);
      expect(matchesCanadianLab('lifelabs')).toBe(true);
      expect(matchesCanadianLab('LifeLabs')).toBe(true);
      expect(matchesCanadianLab('PUBLIC HEALTH ONTARIO')).toBe(true);
      expect(matchesCanadianLab('public health ontario')).toBe(true);
    });

    test('extra whitespace does not break matching', () => {
      expect(matchesCanadianLab('  LifeLabs  ')).toBe(true);
      expect(matchesCanadianLab('Public  Health   Ontario')).toBe(true);
      expect(matchesCanadianLab('   Dynacare   Medical   Lab   ')).toBe(true);
    });
  });

  describe('All Canadian Labs Recognition', () => {
    test('recognizes LifeLabs variations', () => {
      expect(matchesCanadianLab('LifeLabs')).toBe(true);
      expect(matchesCanadianLab('LifeLabs Medical Laboratory')).toBe(true);
      expect(matchesCanadianLab('LIFELABS LAB')).toBe(true);
    });

    test('recognizes Public Health Ontario variations', () => {
      expect(matchesCanadianLab('Public Health Ontario')).toBe(true);
      expect(matchesCanadianLab('Public Health Ontario Laboratory')).toBe(true);
      expect(matchesCanadianLab('PHO')).toBe(true);
      expect(matchesCanadianLab('PHO Lab')).toBe(true);
    });

    test('recognizes Dynacare variations', () => {
      expect(matchesCanadianLab('Dynacare')).toBe(true);
      expect(matchesCanadianLab('Dynacare Medical Laboratory')).toBe(true);
      expect(matchesCanadianLab('DYNACARE LAB')).toBe(true);
    });

    test('recognizes BC CDC variations', () => {
      expect(matchesCanadianLab('BC CDC')).toBe(true);
      expect(matchesCanadianLab('bc cdc')).toBe(true);
      expect(matchesCanadianLab('BCCDC')).toBe(true);
      expect(matchesCanadianLab('BC CDC Laboratory')).toBe(true);
    });

    test('recognizes Alberta Precision Labs variations', () => {
      expect(matchesCanadianLab('Alberta Precision Labs')).toBe(true);
      expect(matchesCanadianLab('Alberta Precision Laboratories')).toBe(true);
      expect(matchesCanadianLab('APL')).toBe(true);
      expect(matchesCanadianLab('APL Medical Laboratory')).toBe(true);
    });

    test('recognizes Gamma-Dynacare', () => {
      expect(matchesCanadianLab('Gamma-Dynacare')).toBe(true);
      expect(matchesCanadianLab('Gamma-Dynacare Laboratory')).toBe(true);
      expect(matchesCanadianLab('GAMMA-DYNACARE')).toBe(true);
    });

    test('recognizes MedLabs', () => {
      expect(matchesCanadianLab('MedLabs')).toBe(true);
      expect(matchesCanadianLab('MedLabs Laboratory')).toBe(true);
      expect(matchesCanadianLab('MEDLABS')).toBe(true);
    });

    test('recognizes Bio-Test', () => {
      expect(matchesCanadianLab('Bio-Test')).toBe(true);
      expect(matchesCanadianLab('Bio-Test Laboratory')).toBe(true);
      expect(matchesCanadianLab('BIO-TEST')).toBe(true);
    });

    test('recognizes IDEXX', () => {
      expect(matchesCanadianLab('IDEXX')).toBe(true);
      expect(matchesCanadianLab('idexx')).toBe(true);
      expect(matchesCanadianLab('IDEXX Laboratory')).toBe(true);
    });

    test('recognizes Hassle Free Clinic', () => {
      expect(matchesCanadianLab('Hassle Free Clinic')).toBe(true);
      expect(matchesCanadianLab('HASSLE FREE CLINIC')).toBe(true);
      expect(matchesCanadianLab('HFC')).toBe(true);
    });

    test('recognizes Mapletree Medical', () => {
      expect(matchesCanadianLab('Mapletree Medical')).toBe(true);
      expect(matchesCanadianLab('MAPLETREE MEDICAL')).toBe(true);
      expect(matchesCanadianLab('Mapletree Medical Laboratory')).toBe(true);
    });
  });

  describe('Negative Cases - Non-Canadian Labs', () => {
    test('rejects unrecognized labs', () => {
      expect(matchesCanadianLab('Unknown Lab Inc')).toBe(false);
      expect(matchesCanadianLab('Quest Diagnostics')).toBe(false);
      expect(matchesCanadianLab('LabCorp')).toBe(false);
      expect(matchesCanadianLab('Mayo Clinic Laboratories')).toBe(false);
    });

    test('rejects partial matches that are not in the list', () => {
      expect(matchesCanadianLab('Life')).toBe(false);
      expect(matchesCanadianLab('Labs')).toBe(false);
      expect(matchesCanadianLab('Health Ontario')).toBe(false);
    });

    test('rejects empty and whitespace-only strings', () => {
      expect(matchesCanadianLab('')).toBe(false);
      expect(matchesCanadianLab('   ')).toBe(false);
      expect(matchesCanadianLab('\t\n')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles lab names with extra text before', () => {
      expect(matchesCanadianLab('Medical Services by LifeLabs')).toBe(true);
    });

    test('handles lab names with extra text after', () => {
      expect(matchesCanadianLab('LifeLabs Toronto Branch')).toBe(true);
      expect(matchesCanadianLab('Public Health Ontario - Toronto')).toBe(true);
    });

    test('handles lab names with multiple suffixes', () => {
      expect(matchesCanadianLab('LifeLabs Medical Laboratory Inc.')).toBe(true);
    });

    test('case sensitivity does not affect matching', () => {
      expect(matchesCanadianLab('lIfElAbS')).toBe(true);
      expect(matchesCanadianLab('pUbLiC hEaLtH oNtArIo')).toBe(true);
    });

    test('handles unicode whitespace characters', () => {
      expect(matchesCanadianLab('LifeLabs\u00A0Laboratory')).toBe(true); // non-breaking space
    });
  });

  describe('Real-World LLM Variations', () => {
    test('matches common LLM-generated variations', () => {
      // Public Health Ontario variations
      expect(matchesCanadianLab('Public Health Ontario Laboratory')).toBe(true);
      expect(matchesCanadianLab('Public Health Ontario Lab')).toBe(true);
      expect(matchesCanadianLab('PHO Laboratory')).toBe(true);
      expect(matchesCanadianLab('PHO Lab')).toBe(true);

      // LifeLabs variations
      expect(matchesCanadianLab('LifeLabs Medical Laboratory Services')).toBe(true);
      expect(matchesCanadianLab('LifeLabs Inc.')).toBe(true);
      expect(matchesCanadianLab('LifeLabs Diagnostics')).toBe(true);

      // Dynacare variations
      expect(matchesCanadianLab('Dynacare Laboratories')).toBe(true);
      expect(matchesCanadianLab('Dynacare Medical Laboratories')).toBe(true);
    });

    test('handles formatting inconsistencies', () => {
      expect(matchesCanadianLab('Life Labs')).toBe(true); // space in middle
      expect(matchesCanadianLab('Life-Labs')).toBe(true); // hyphen instead
      expect(matchesCanadianLab('Alberta  Precision  Labs')).toBe(true); // multiple spaces
    });
  });
});
