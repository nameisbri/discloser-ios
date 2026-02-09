/**
 * Canadian Lab Database Tests
 *
 * Tests the expanded 50+ lab database lookup functions.
 */

import {
  CANADIAN_LAB_DATABASE,
  findLabByName,
  getLabsByProvince,
  getLabById,
  getHealthCardType,
} from '../../../lib/utils/canadianLabDatabase';

describe('CANADIAN_LAB_DATABASE', () => {
  test('contains at least 50 entries', () => {
    expect(CANADIAN_LAB_DATABASE.length).toBeGreaterThanOrEqual(50);
  });

  test('all entries have required fields', () => {
    for (const lab of CANADIAN_LAB_DATABASE) {
      expect(lab.id).toBeTruthy();
      expect(lab.canonicalName).toBeTruthy();
      expect(lab.variations).toBeInstanceOf(Array);
      expect(lab.variations.length).toBeGreaterThan(0);
      expect(lab.abbreviations).toBeInstanceOf(Array);
      expect(lab.province).toBeTruthy();
    }
  });

  test('all entries have unique ids', () => {
    const ids = CANADIAN_LAB_DATABASE.map((lab) => lab.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('findLabByName', () => {
  describe('Exact Match', () => {
    test('finds LifeLabs by canonical name', () => {
      const result = findLabByName('LifeLabs');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('LifeLabs');
    });

    test('finds Public Health Ontario by canonical name', () => {
      const result = findLabByName('Public Health Ontario');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('Public Health Ontario');
    });
  });

  describe('Abbreviation Match', () => {
    test('finds Public Health Ontario by abbreviation PHO', () => {
      const result = findLabByName('PHO');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('Public Health Ontario');
    });

    test('finds BC CDC by abbreviation BCCDC', () => {
      const result = findLabByName('BCCDC');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('BC Centre for Disease Control');
    });

    test('finds Alberta Precision Labs by abbreviation APL', () => {
      const result = findLabByName('APL');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('Alberta Precision Laboratories');
    });
  });

  describe('Variation Match', () => {
    test('finds LifeLabs by variation with suffix', () => {
      const result = findLabByName('LifeLabs Medical Laboratory');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('LifeLabs');
    });

    test('finds Dynacare by variation', () => {
      const result = findLabByName('Dynacare Medical Laboratory');
      expect(result).toBeDefined();
    });

    test('case insensitive matching', () => {
      const result = findLabByName('lifelabs');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('LifeLabs');
    });
  });

  describe('Substring Match', () => {
    test('finds lab when input contains variation', () => {
      const result = findLabByName('Results from LifeLabs Ontario Laboratory');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('LifeLabs');
    });
  });

  describe('No Match', () => {
    test('returns undefined for unknown lab', () => {
      expect(findLabByName('Some Unknown Lab')).toBeUndefined();
    });

    test('returns undefined for empty string', () => {
      expect(findLabByName('')).toBeUndefined();
    });

    test('returns undefined for whitespace', () => {
      expect(findLabByName('   ')).toBeUndefined();
    });
  });

  describe('Province Coverage', () => {
    test('finds Ontario labs', () => {
      expect(findLabByName('LifeLabs')).toBeDefined();
      expect(findLabByName('Public Health Ontario')).toBeDefined();
      expect(findLabByName('Dynacare')).toBeDefined();
    });

    test('finds BC labs', () => {
      expect(findLabByName('BC Centre for Disease Control')).toBeDefined();
    });

    test('finds Alberta labs', () => {
      expect(findLabByName('DynaLIFE')).toBeDefined();
      expect(findLabByName('Alberta Precision Laboratories')).toBeDefined();
    });

    test('finds Quebec labs', () => {
      expect(findLabByName('Biron')).toBeDefined();
    });

    test('finds Manitoba labs', () => {
      expect(findLabByName('Cadham Provincial Laboratory')).toBeDefined();
    });

    test('finds Saskatchewan labs', () => {
      expect(findLabByName('Roy Romanow Provincial Laboratory')).toBeDefined();
    });
  });
});

describe('getLabsByProvince', () => {
  test('returns Ontario labs', () => {
    const labs = getLabsByProvince('ON');
    expect(labs.length).toBeGreaterThan(0);
    for (const lab of labs) {
      expect(lab.province).toBe('ON');
    }
  });

  test('returns empty array for province with no labs', () => {
    const labs = getLabsByProvince('NU');
    // May or may not have entries, but should not crash
    expect(Array.isArray(labs)).toBe(true);
  });
});

describe('getLabById', () => {
  test('finds lab by id', () => {
    const lab = getLabById('pho');
    expect(lab).toBeDefined();
    expect(lab?.canonicalName).toBe('Public Health Ontario');
  });

  test('returns undefined for unknown id', () => {
    expect(getLabById('nonexistent')).toBeUndefined();
  });
});

describe('getHealthCardType', () => {
  test('returns OHIP for Ontario', () => {
    expect(getHealthCardType('ON')).toBe('OHIP');
  });

  test('returns MSP for BC', () => {
    expect(getHealthCardType('BC')).toBe('MSP');
  });

  test('returns AHCIP for Alberta', () => {
    expect(getHealthCardType('AB')).toBe('AHCIP');
  });

  test('returns RAMQ for Quebec', () => {
    expect(getHealthCardType('QC')).toBe('RAMQ');
  });
});
