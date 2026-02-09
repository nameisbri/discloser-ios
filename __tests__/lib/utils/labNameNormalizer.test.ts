/**
 * Lab Name Normalizer Tests
 *
 * Comprehensive test suite covering normalization, abbreviation expansion,
 * suffix removal, and recognized lab matching functionality.
 */

import { normalizeLabName, matchesRecognizedLab, matchesCanadianLab } from '../../../lib/utils/labNameNormalizer';

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

    test('expands Quest to quest diagnostics', () => {
      expect(normalizeLabName('Quest')).toBe('quest diagnostics');
      expect(normalizeLabName('quest')).toBe('quest diagnostics');
    });

    test('expands UKHSA to uk health security agency', () => {
      expect(normalizeLabName('UKHSA')).toBe('uk health security agency');
      expect(normalizeLabName('ukhsa')).toBe('uk health security agency');
    });

    test('expands NHSBT to nhs blood and transplant', () => {
      expect(normalizeLabName('NHSBT')).toBe('nhs blood and transplant');
      expect(normalizeLabName('nhsbt')).toBe('nhs blood and transplant');
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

describe('matchesRecognizedLab', () => {
  describe('Acceptance Criteria - Required Matches', () => {
    test('matches "Public Health Ontario Laboratory" to "public health ontario"', () => {
      expect(matchesRecognizedLab('Public Health Ontario Laboratory')).toBe(true);
    });

    test('matches "LifeLabs Medical Laboratory" to "lifelabs"', () => {
      expect(matchesRecognizedLab('LifeLabs Medical Laboratory')).toBe(true);
    });

    test('matches "PHO" to "public health ontario"', () => {
      expect(matchesRecognizedLab('PHO')).toBe(true);
    });

    test('case-insensitive matching works', () => {
      expect(matchesRecognizedLab('LIFELABS')).toBe(true);
      expect(matchesRecognizedLab('lifelabs')).toBe(true);
      expect(matchesRecognizedLab('LifeLabs')).toBe(true);
      expect(matchesRecognizedLab('PUBLIC HEALTH ONTARIO')).toBe(true);
      expect(matchesRecognizedLab('public health ontario')).toBe(true);
    });

    test('extra whitespace does not break matching', () => {
      expect(matchesRecognizedLab('  LifeLabs  ')).toBe(true);
      expect(matchesRecognizedLab('Public  Health   Ontario')).toBe(true);
      expect(matchesRecognizedLab('   Dynacare   Medical   Lab   ')).toBe(true);
    });
  });

  describe('All Canadian Labs Recognition', () => {
    test('recognizes LifeLabs variations', () => {
      expect(matchesRecognizedLab('LifeLabs')).toBe(true);
      expect(matchesRecognizedLab('LifeLabs Medical Laboratory')).toBe(true);
      expect(matchesRecognizedLab('LIFELABS LAB')).toBe(true);
    });

    test('recognizes Public Health Ontario variations', () => {
      expect(matchesRecognizedLab('Public Health Ontario')).toBe(true);
      expect(matchesRecognizedLab('Public Health Ontario Laboratory')).toBe(true);
      expect(matchesRecognizedLab('PHO')).toBe(true);
      expect(matchesRecognizedLab('PHO Lab')).toBe(true);
    });

    test('recognizes Dynacare variations', () => {
      expect(matchesRecognizedLab('Dynacare')).toBe(true);
      expect(matchesRecognizedLab('Dynacare Medical Laboratory')).toBe(true);
      expect(matchesRecognizedLab('DYNACARE LAB')).toBe(true);
    });

    test('recognizes BC CDC variations', () => {
      expect(matchesRecognizedLab('BC CDC')).toBe(true);
      expect(matchesRecognizedLab('bc cdc')).toBe(true);
      expect(matchesRecognizedLab('BCCDC')).toBe(true);
      expect(matchesRecognizedLab('BC CDC Laboratory')).toBe(true);
    });

    test('recognizes Alberta Precision Labs variations', () => {
      expect(matchesRecognizedLab('Alberta Precision Labs')).toBe(true);
      expect(matchesRecognizedLab('Alberta Precision Laboratories')).toBe(true);
      expect(matchesRecognizedLab('APL')).toBe(true);
      expect(matchesRecognizedLab('APL Medical Laboratory')).toBe(true);
    });

    test('recognizes Gamma-Dynacare', () => {
      expect(matchesRecognizedLab('Gamma-Dynacare')).toBe(true);
      expect(matchesRecognizedLab('Gamma-Dynacare Laboratory')).toBe(true);
      expect(matchesRecognizedLab('GAMMA-DYNACARE')).toBe(true);
    });

    test('recognizes MedLabs', () => {
      expect(matchesRecognizedLab('MedLabs')).toBe(true);
      expect(matchesRecognizedLab('MedLabs Laboratory')).toBe(true);
      expect(matchesRecognizedLab('MEDLABS')).toBe(true);
    });

    test('recognizes Bio-Test', () => {
      expect(matchesRecognizedLab('Bio-Test')).toBe(true);
      expect(matchesRecognizedLab('Bio-Test Laboratory')).toBe(true);
      expect(matchesRecognizedLab('BIO-TEST')).toBe(true);
    });

    test('recognizes IDEXX', () => {
      expect(matchesRecognizedLab('IDEXX')).toBe(true);
      expect(matchesRecognizedLab('idexx')).toBe(true);
      expect(matchesRecognizedLab('IDEXX Laboratory')).toBe(true);
    });

    test('recognizes Hassle Free Clinic', () => {
      expect(matchesRecognizedLab('Hassle Free Clinic')).toBe(true);
      expect(matchesRecognizedLab('HASSLE FREE CLINIC')).toBe(true);
      expect(matchesRecognizedLab('HFC')).toBe(true);
    });

    test('recognizes Mapletree Medical', () => {
      expect(matchesRecognizedLab('Mapletree Medical')).toBe(true);
      expect(matchesRecognizedLab('MAPLETREE MEDICAL')).toBe(true);
      expect(matchesRecognizedLab('Mapletree Medical Laboratory')).toBe(true);
    });
  });

  describe('US Labs Recognition', () => {
    test('recognizes Quest Diagnostics', () => {
      expect(matchesRecognizedLab('Quest Diagnostics')).toBe(true);
      expect(matchesRecognizedLab('quest diagnostics')).toBe(true);
      expect(matchesRecognizedLab('Quest Diagnostics Inc')).toBe(true);
      expect(matchesRecognizedLab('Quest Diagnostics Laboratory')).toBe(true);
      expect(matchesRecognizedLab('Quest')).toBe(true);
    });

    test('recognizes LabCorp', () => {
      expect(matchesRecognizedLab('LabCorp')).toBe(true);
      expect(matchesRecognizedLab('labcorp')).toBe(true);
      expect(matchesRecognizedLab('LABCORP')).toBe(true);
      expect(matchesRecognizedLab('LabCorp Diagnostics')).toBe(true);
    });

    test('recognizes BioReference', () => {
      expect(matchesRecognizedLab('BioReference Laboratories')).toBe(true);
      expect(matchesRecognizedLab('BioReference Labs')).toBe(true);
    });

    test('recognizes Sonic Healthcare', () => {
      expect(matchesRecognizedLab('Sonic Healthcare USA')).toBe(true);
      expect(matchesRecognizedLab('Sonic Healthcare')).toBe(true);
    });

    test('recognizes ARUP', () => {
      expect(matchesRecognizedLab('ARUP Laboratories')).toBe(true);
      expect(matchesRecognizedLab('ARUP Labs')).toBe(true);
    });

    test('recognizes Mayo Clinic', () => {
      expect(matchesRecognizedLab('Mayo Clinic Laboratories')).toBe(true);
      expect(matchesRecognizedLab('Mayo Clinic Labs')).toBe(true);
    });

    test('recognizes Clinical Pathology', () => {
      expect(matchesRecognizedLab('Clinical Pathology Laboratories')).toBe(true);
      expect(matchesRecognizedLab('Clinical Pathology Labs')).toBe(true);
    });
  });

  describe('UK Labs Recognition', () => {
    test('recognizes NHS Blood and Transplant', () => {
      expect(matchesRecognizedLab('NHS Blood and Transplant')).toBe(true);
      expect(matchesRecognizedLab('NHSBT')).toBe(true);
    });

    test('recognizes UK Health Security Agency', () => {
      expect(matchesRecognizedLab('UK Health Security Agency')).toBe(true);
      expect(matchesRecognizedLab('UKHSA')).toBe(true);
    });
  });

  describe('Negative Cases - Unrecognized Labs', () => {
    test('rejects unrecognized labs', () => {
      expect(matchesRecognizedLab('Unknown Lab Inc')).toBe(false);
      expect(matchesRecognizedLab('Random Diagnostics')).toBe(false);
    });

    test('rejects partial matches that are not in the list', () => {
      expect(matchesRecognizedLab('Life')).toBe(false);
      expect(matchesRecognizedLab('Labs')).toBe(false);
      expect(matchesRecognizedLab('Health Ontario')).toBe(false);
    });

    test('rejects empty and whitespace-only strings', () => {
      expect(matchesRecognizedLab('')).toBe(false);
      expect(matchesRecognizedLab('   ')).toBe(false);
      expect(matchesRecognizedLab('\t\n')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles lab names with extra text before', () => {
      expect(matchesRecognizedLab('Medical Services by LifeLabs')).toBe(true);
    });

    test('handles lab names with extra text after', () => {
      expect(matchesRecognizedLab('LifeLabs Toronto Branch')).toBe(true);
      expect(matchesRecognizedLab('Public Health Ontario - Toronto')).toBe(true);
    });

    test('handles lab names with multiple suffixes', () => {
      expect(matchesRecognizedLab('LifeLabs Medical Laboratory Inc.')).toBe(true);
    });

    test('case sensitivity does not affect matching', () => {
      expect(matchesRecognizedLab('lIfElAbS')).toBe(true);
      expect(matchesRecognizedLab('pUbLiC hEaLtH oNtArIo')).toBe(true);
    });

    test('handles unicode whitespace characters', () => {
      expect(matchesRecognizedLab('LifeLabs\u00A0Laboratory')).toBe(true); // non-breaking space
    });
  });

  describe('Real-World LLM Variations', () => {
    test('matches common LLM-generated variations', () => {
      // Public Health Ontario variations
      expect(matchesRecognizedLab('Public Health Ontario Laboratory')).toBe(true);
      expect(matchesRecognizedLab('Public Health Ontario Lab')).toBe(true);
      expect(matchesRecognizedLab('PHO Laboratory')).toBe(true);
      expect(matchesRecognizedLab('PHO Lab')).toBe(true);

      // LifeLabs variations
      expect(matchesRecognizedLab('LifeLabs Medical Laboratory Services')).toBe(true);
      expect(matchesRecognizedLab('LifeLabs Inc.')).toBe(true);
      expect(matchesRecognizedLab('LifeLabs Diagnostics')).toBe(true);

      // Dynacare variations
      expect(matchesRecognizedLab('Dynacare Laboratories')).toBe(true);
      expect(matchesRecognizedLab('Dynacare Medical Laboratories')).toBe(true);
    });

    test('handles formatting inconsistencies', () => {
      expect(matchesRecognizedLab('Life Labs')).toBe(true); // space in middle
      expect(matchesRecognizedLab('Life-Labs')).toBe(true); // hyphen instead
      expect(matchesRecognizedLab('Alberta  Precision  Labs')).toBe(true); // multiple spaces
    });
  });
});

describe('matchesCanadianLab (deprecated alias)', () => {
  test('matchesCanadianLab is exported as an alias for matchesRecognizedLab', () => {
    expect(matchesCanadianLab).toBe(matchesRecognizedLab);
  });

  test('matchesCanadianLab still works for backward compatibility', () => {
    expect(matchesCanadianLab('LifeLabs')).toBe(true);
    expect(matchesCanadianLab('Quest Diagnostics')).toBe(true);
    expect(matchesCanadianLab('Unknown Lab')).toBe(false);
  });
});
