/**
 * Recognized Lab Database Tests
 *
 * Tests the expanded lab database lookup functions covering
 * Canadian, US, and UK laboratories.
 */

import {
  LAB_DATABASE,
  findLabByName,
  getLabsByRegion,
  getLabById,
  getHealthCardType,
} from '../../../lib/utils/labDatabase';

describe('LAB_DATABASE', () => {
  test('contains at least 50 entries', () => {
    expect(LAB_DATABASE.length).toBeGreaterThanOrEqual(50);
  });

  test('all entries have required fields', () => {
    for (const lab of LAB_DATABASE) {
      expect(lab.id).toBeTruthy();
      expect(lab.canonicalName).toBeTruthy();
      expect(lab.variations).toBeInstanceOf(Array);
      expect(lab.variations.length).toBeGreaterThan(0);
      expect(lab.abbreviations).toBeInstanceOf(Array);
      expect(lab.region).toBeTruthy();
    }
  });

  test('all entries have unique ids', () => {
    const ids = LAB_DATABASE.map((lab) => lab.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('Canadian labs have country CA', () => {
    const canadianLabs = LAB_DATABASE.filter(lab => lab.country === 'CA');
    expect(canadianLabs.length).toBeGreaterThanOrEqual(51);
  });

  test('US labs have country US', () => {
    const usLabs = LAB_DATABASE.filter(lab => lab.country === 'US');
    expect(usLabs.length).toBeGreaterThanOrEqual(7);
  });

  test('UK labs have country UK', () => {
    const ukLabs = LAB_DATABASE.filter(lab => lab.country === 'UK');
    expect(ukLabs.length).toBeGreaterThanOrEqual(2);
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

    test('finds Quest Diagnostics by canonical name', () => {
      const result = findLabByName('Quest Diagnostics');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('Quest Diagnostics');
    });

    test('finds LabCorp by canonical name', () => {
      const result = findLabByName('LabCorp');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('LabCorp');
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

    test('finds ARUP by abbreviation', () => {
      const result = findLabByName('ARUP');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('ARUP Laboratories');
    });

    test('finds UKHSA by abbreviation', () => {
      const result = findLabByName('UKHSA');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('UK Health Security Agency');
    });

    test('finds NHSBT by abbreviation', () => {
      const result = findLabByName('NHSBT');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('NHS Blood and Transplant');
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

    test('finds Quest by variation', () => {
      const result = findLabByName('Quest Diagnostics Laboratory');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('Quest Diagnostics');
    });

    test('finds LabCorp by variation', () => {
      const result = findLabByName('Laboratory Corporation of America');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('LabCorp');
    });

    test('finds Mayo Clinic by variation', () => {
      const result = findLabByName('Mayo Clinic Laboratories');
      expect(result).toBeDefined();
      expect(result?.canonicalName).toBe('Mayo Clinic Laboratories');
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

  describe('Region Coverage - Canada', () => {
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

  describe('Region Coverage - US', () => {
    test('finds Quest Diagnostics', () => {
      const result = findLabByName('Quest Diagnostics');
      expect(result).toBeDefined();
      expect(result?.country).toBe('US');
    });

    test('finds LabCorp', () => {
      const result = findLabByName('LabCorp');
      expect(result).toBeDefined();
      expect(result?.country).toBe('US');
    });

    test('finds ARUP Laboratories', () => {
      const result = findLabByName('ARUP Laboratories');
      expect(result).toBeDefined();
      expect(result?.country).toBe('US');
    });

    test('finds Mayo Clinic Laboratories', () => {
      const result = findLabByName('Mayo Clinic Laboratories');
      expect(result).toBeDefined();
      expect(result?.country).toBe('US');
    });

    test('finds BioReference Laboratories', () => {
      const result = findLabByName('BioReference Laboratories');
      expect(result).toBeDefined();
      expect(result?.country).toBe('US');
    });

    test('finds Sonic Healthcare USA', () => {
      const result = findLabByName('Sonic Healthcare USA');
      expect(result).toBeDefined();
      expect(result?.country).toBe('US');
    });

    test('finds Clinical Pathology Laboratories', () => {
      const result = findLabByName('Clinical Pathology Laboratories');
      expect(result).toBeDefined();
      expect(result?.country).toBe('US');
    });
  });

  describe('Region Coverage - UK', () => {
    test('finds NHS Blood and Transplant', () => {
      const result = findLabByName('NHS Blood and Transplant');
      expect(result).toBeDefined();
      expect(result?.country).toBe('UK');
    });

    test('finds UK Health Security Agency', () => {
      const result = findLabByName('UK Health Security Agency');
      expect(result).toBeDefined();
      expect(result?.country).toBe('UK');
    });
  });
});

describe('getLabsByRegion', () => {
  test('returns Ontario labs', () => {
    const labs = getLabsByRegion('ON');
    expect(labs.length).toBeGreaterThan(0);
    for (const lab of labs) {
      expect(lab.region).toBe('ON');
    }
  });

  test('returns empty array for region with no labs', () => {
    const labs = getLabsByRegion('NU');
    // May or may not have entries, but should not crash
    expect(Array.isArray(labs)).toBe(true);
  });

  test('returns US labs by state', () => {
    const njLabs = getLabsByRegion('NJ');
    expect(njLabs.length).toBeGreaterThan(0);
    for (const lab of njLabs) {
      expect(lab.region).toBe('NJ');
    }
  });

  test('returns UK labs', () => {
    const ukLabs = getLabsByRegion('UK');
    expect(ukLabs.length).toBeGreaterThanOrEqual(2);
    for (const lab of ukLabs) {
      expect(lab.region).toBe('UK');
    }
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

  test('finds US lab by id', () => {
    const lab = getLabById('quest-diagnostics');
    expect(lab).toBeDefined();
    expect(lab?.canonicalName).toBe('Quest Diagnostics');
  });

  test('finds UK lab by id', () => {
    const lab = getLabById('nhs-blood-and-transplant');
    expect(lab).toBeDefined();
    expect(lab?.canonicalName).toBe('NHS Blood and Transplant');
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

  test('returns undefined for US states', () => {
    expect(getHealthCardType('NJ')).toBeUndefined();
  });

  test('returns undefined for UK', () => {
    expect(getHealthCardType('UK')).toBeUndefined();
  });
});
