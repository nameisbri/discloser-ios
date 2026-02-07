// Maps lab-specific test names to standardized names

const TEST_NAME_MAPPING: Record<string, string> = {
  // HIV tests - all normalize to HIV-1/2 for consistency
  'HIV': 'HIV-1/2',
  'HIV 1/2 AG/AB COMBO SCREEN': 'HIV-1/2',
  'HIV1/2 AG/AB COMBO SCREEN': 'HIV-1/2',
  'HIV 1/2 ANTIBODY': 'HIV-1/2',
  'HIV FINAL INTERPRETATION': 'HIV-1/2',
  'HIV-1/2 AG/AB': 'HIV-1/2',
  'HIV1/2 AG/AB': 'HIV-1/2',

  // Hepatitis B tests
  'HEPATITIS B SURFACE ANTIGEN': 'Hepatitis B',
  'HBV SURFACE ANTIGEN': 'Hepatitis B',
  'HEPATITIS B SURFACE AG': 'Hepatitis B',
  'HBSAG': 'Hepatitis B',
  'HEPATITIS B CORE TOTAL ANTIBODY': 'Hepatitis B Core',
  'HEPATITIS B CORE ANTIBODY': 'Hepatitis B Core',
  'HBV CORE AB': 'Hepatitis B Core',
  'HEPATITIS B SURFACE ANTIBODY': 'Hepatitis B',
  'HEPATITIS B IMMUNE STATUS': 'Hepatitis B',
  'HEPATITIS B VIRUS INTERPRETATION': 'Hepatitis B',

  // Hepatitis C tests
  'HEPATITIS C ANTIBODY': 'Hepatitis C',
  'HCV ANTIBODY': 'Hepatitis C',
  'HEPATITIS C AB': 'Hepatitis C',
  'HEPATITIS C VIRUS INTERPRETATION': 'Hepatitis C',

  // Hepatitis A tests
  'HEPATITIS A IGG ANTIBODY': 'Hepatitis A',
  'HEPATITIS A VIRUS INTERPRETATION': 'Hepatitis A',

  // Syphilis tests
  'SYPHILIS ANTIBODY SCREEN': 'Syphilis',
  'SYPHILIS SEROLOGY': 'Syphilis',
  'SYPHILIS AB SCREEN': 'Syphilis',
  'SYPHILIS SEROLOGY INTERPRETATION': 'Syphilis',
  'RPR': 'Syphilis',

  // Gonorrhea tests
  'NEISSERIA GONORRHOEAE': 'Gonorrhea',
  'N. GONORRHOEAE': 'Gonorrhea',
  'GC CULTURE': 'Gonorrhea',
  'NEISSERIA GONORRHOEAE DNA': 'Gonorrhea',
  'N. GONORRHOEAE INVESTIGATION URINE': 'Gonorrhea',

  // Chlamydia tests
  'CHLAMYDIA TRACHOMATIS': 'Chlamydia',
  'C. TRACHOMATIS': 'Chlamydia',
  'CT CULTURE': 'Chlamydia',
  'CHLAMYDIA TRACHOMATIS DNA': 'Chlamydia',
  'CHLAMYDIA INVESTIGATION URINE': 'Chlamydia',

  // Herpes tests
  'HERPES SIMPLEX VIRUS 1 IGG': 'Herpes (HSV-1)',
  'HSV-1 IGG': 'Herpes (HSV-1)',
  'HERPES SIMPLEX VIRUS 2 IGG': 'Herpes (HSV-2)',
  'HSV-2 IGG': 'Herpes (HSV-2)',
  'HERPES SIMPLEX VIRUS INTERPRETATION': 'Herpes',

  // Trichomoniasis
  'TRICHOMONAS VAGINALIS': 'Trichomoniasis',
  'TRICHOMONAS VAGINALIS DNA': 'Trichomoniasis',
  'TRICHOMONIASIS': 'Trichomoniasis',
};

export function normalizeTestName(testName: string): string {
  if (!testName) return 'Unknown Test';

  const upperTestName = testName.toUpperCase().trim();

  // Exact match first
  if (TEST_NAME_MAPPING[upperTestName]) {
    return TEST_NAME_MAPPING[upperTestName];
  }

  // Partial match
  for (const [key, value] of Object.entries(TEST_NAME_MAPPING)) {
    if (upperTestName.includes(key)) {
      return value;
    }
  }

  // Acronyms that should stay uppercase
  const acronyms = ['HIV', 'HSV', 'HPV', 'HBV', 'HCV', 'HAV', 'RPR', 'STI', 'STD'];

  // Return title-cased version if no match, preserving acronyms
  return testName
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (acronyms.includes(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// Checks if a test is a chronic/status STI (not routinely curable)
export function isStatusSTI(testName: string): boolean {
  const patterns = [/hiv/i, /hsv[-\s]?[12]/i, /herpes/i, /hepatitis\s*[bc]/i, /hep\s*[bc]/i, /hbv/i, /hcv/i, /hpv/i, /papilloma/i];
  return patterns.some((p) => p.test(testName));
}
