// Normalizes varied test names to standardized format

const TEST_MAP: Record<string, string> = {
  // HIV
  "HIV 1/2 AG/AB COMBO SCREEN": "HIV-1/2",
  "HIV1/2 AG/AB COMBO SCREEN": "HIV-1/2",
  "HIV 1/2 ANTIBODY": "HIV-1/2",
  "HIV FINAL INTERPRETATION": "HIV-1/2",
  "HIV-1/2 AG/AB": "HIV-1/2",
  // Hepatitis
  "HEPATITIS B SURFACE ANTIGEN": "Hepatitis B",
  "HEPATITIS B SURFACE AG": "Hepatitis B",
  "HBSAG": "Hepatitis B",
  "HEPATITIS B CORE": "Hepatitis B Core",
  "HEPATITIS C ANTIBODY": "Hepatitis C",
  "HEPATITIS C AB": "Hepatitis C",
  "HCV ANTIBODY": "Hepatitis C",
  "HEPATITIS A": "Hepatitis A",
  // Syphilis
  "SYPHILIS ANTIBODY SCREEN": "Syphilis",
  "SYPHILIS SEROLOGY": "Syphilis",
  "RPR": "Syphilis",
  // Bacterial
  "NEISSERIA GONORRHOEAE": "Gonorrhea",
  "N. GONORRHOEAE": "Gonorrhea",
  "CHLAMYDIA TRACHOMATIS": "Chlamydia",
  "C. TRACHOMATIS": "Chlamydia",
  "TRICHOMONAS VAGINALIS": "Trichomonas",
  // Herpes
  "HERPES SIMPLEX VIRUS 1": "HSV-1",
  "HSV-1": "HSV-1",
  "HERPES SIMPLEX VIRUS 2": "HSV-2",
  "HSV-2": "HSV-2",
};

export function normalizeTestName(name: string): string {
  if (!name) return "Unknown";
  const upper = name.toUpperCase();
  
  // Exact match
  if (TEST_MAP[upper]) return TEST_MAP[upper];
  
  // Partial match
  for (const [key, value] of Object.entries(TEST_MAP)) {
    if (upper.includes(key)) return value;
  }
  
  // Title case fallback
  return name.split(" ").map(w => 
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(" ");
}

