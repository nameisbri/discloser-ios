export const TEST_RESULTS = {
  POSITIVE: "Positive",
  NEGATIVE: "Negative",
  IMMUNE: "Immune",
  NOT_IMMUNE: "Not Immune",
  DETECTED: "Detected",
  NOT_DETECTED: "Not Detected",
  INDETERMINATE: "Indeterminate",
  NUMERIC: "Numeric",
  REACTIVE: "Reactive",
  NON_REACTIVE: "Non-Reactive",
};

export const STI_TESTS = [
  // LifeLabs Format Tests
  {
    name: "Chlamydia trachomatis",
    regex:
      /CHLAMYDIA\s+TRACHOMATIS\s+([A-Z]+)|\s*Chlamydia\s+trachomatis\s+DNA\s+\(NAAT\)\s+[A-Za-z]+\s+(NEGATIVE|POSITIVE)/i,
    notePatterns: [
      {
        pattern: /SOURCE:\s*([^\n]+)/i,
        label: "Source",
      },
      {
        pattern: /DATE OF COLLECTION\s+([^\n]+)|Collection\s+Date\s+([^\n]+)/i,
        label: "Collection Date",
      },
      {
        pattern:
          /TIME OF COLLECTION\s+([0-9:]+)|Collection\s+Time\s+([0-9:]+)/i,
        label: "Collection Time",
      },
    ],
  },
  {
    name: "Neisseria gonorrhoeae",
    regex:
      /NEISSERIA\s+GONORRHOEAE\s+([A-Z]+)|\s*Neisseria\s+gonorrhoeae\s+DNA\s+\(NAAT\)\s+[A-Za-z]+\s+(NEGATIVE|POSITIVE)/i,
    notePatterns: [
      {
        pattern: /SOURCE:\s*([^\n]+)|Specimen\s+Source\s+([^\n]+)/i,
        label: "Source",
      },
      {
        pattern: /DATE OF COLLECTION\s+([^\n]+)|Collection\s+Date\s+([^\n]+)/i,
        label: "Collection Date",
      },
      {
        pattern:
          /TIME OF COLLECTION\s+([0-9:]+)|Collection\s+Time\s+([0-9:]+)/i,
        label: "Collection Time",
      },
    ],
  },
  {
    name: "Trichomonas vaginalis",
    regex:
      /Trichomonas\s+vaginalis\s+DNA\s+\(NAAT\)\s+[A-Za-z]+\s+(NEGATIVE|POSITIVE)/i,
    notePatterns: [
      {
        pattern: /Specimen\s+Source\s+([^\n]+)/i,
        label: "Source",
      },
      {
        pattern: /Collection\s+Date\s+([^\n]+)/i,
        label: "Collection Date",
      },
      {
        pattern: /Collection\s+Time\s+([0-9:]+)/i,
        label: "Collection Time",
      },
    ],
  },

  // Public Health Lab Format Tests
  // Hepatitis A Tests
  {
    name: "Hepatitis A IgG Antibody",
    regex: /Hepatitis\s+A\s+IgG\s+Antibody\s+([A-Za-z-]+|\d+\s*[a-zA-Z/]+)/i, // Capture numeric values with units
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
      {
        pattern: /Date Collected:\s*([^\n]+)/i,
        label: "Collection Date",
      },
    ],
  },
  {
    name: "Hepatitis A Virus Interpretation",
    regex: /Hepatitis\s+A\s+Virus\s+[Ii]nterpretation\s+([^\n]+)/,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },

  {
    name: "Hepatitis B Surface Antigen",
    regex:
      /Hepatitis\s+B\s+Surface\s+Antigen\s+(Non-Reactive[^\n]*|\d+\s*[a-zA-Z/]+)/i,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
  {
    name: "Hepatitis B Core Total Antibody",
    regex:
      /Hepatitis\s+B\s+Core\s+Total\s+\(IgG\+IgM\)\s+Antibody\s+(Non-Reactive[^\n]*|\d+\s*[a-zA-Z/]+)/i,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
  {
    name: "Hepatitis B Virus Interpretation",
    regex:
      /Hepatitis\s+B\s+Virus\s+[Ii]nterpretation\s+(No evidence of Hepatitis B Virus infection[^\n]*)/,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
  {
    name: "Hepatitis B Surface Antibody",
    regex: /Hepatitis\s+B\s+Surface\s+Antibody\s+([0-9.]+\s*[a-zA-Z/]+)/i,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
  {
    name: "Hepatitis B Immune Status",
    regex: /Hepatitis\s+B\s+[Ii]mmune\s+Status\s+([^\n]+)/,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },

  // Hepatitis C Tests
  {
    name: "Hepatitis C Antibody",
    regex: /Hepatitis\s+C\s+Antibody\s+([A-Za-z-]+|\d+\s*[a-zA-Z/]+)/i, // Capture numeric values with units
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
  {
    name: "Hepatitis C Virus Interpretation",
    regex: /Hepatitis\s+C\s+Virus\s+[Ii]nterpretation\s+([^\n]+)/,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },

  {
    name: "Syphilis Antibody Screen",
    regex: /Syphilis\s+Antibody\s+Screen\s+([A-Za-z-]+|\d+\s*[a-zA-Z/]+)/i, // Capture numeric values with units
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
      {
        pattern: /Date Collected:\s*([^\n]+)/i,
        label: "Collection Date",
      },
    ],
  },
  {
    name: "Syphilis Serology Interpretation",
    regex:
      /Syphilis\s+Serology\s+[Ii]nterpretation\s+([^\n]+(?:infection|detected)\.)/,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
      {
        pattern: /Date Collected:\s*([^\n]+)/i,
        label: "Collection Date",
      },
    ],
  },

  // Herpes Tests
  {
    name: "Herpes Simplex Virus 1 IgG",
    regex:
      /Herpes\s+Simplex\s+Virus\s+1\s+IgG\s+CLIA\s+([A-Za-z-]+|\d+\s*[a-zA-Z/]+)/i, // Capture numeric values with units
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
  {
    name: "Herpes Simplex Virus 2 IgG",
    regex:
      /Herpes\s+Simplex\s+Virus\s+2\s+IgG\s+CLIA\s+([A-Za-z-]+|\d+\s*[a-zA-Z/]+)/i, // Capture numeric values with units
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
  {
    name: "Herpes Simplex Virus Interpretation",
    regex: /Herpes\s+Simplex\s+Virus\s+[Ii]nterpretation\s+([^\n]+)/,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },

  // HIV Tests
  {
    name: "HIV 1/2 Ag/Ab Combo Screen",
    regex:
      /HIV1\s*\/\s*2\s+Ag\/Ab\s+Combo\s+Screen\s+([A-Za-z-]+|\d+\s*[a-zA-Z/]+)/i, // Capture numeric values with units
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
  {
    name: "HIV Final Interpretation",
    regex: /HIV\s+Final\s+[Ii]nterpretation\s+([^\n]+)/,
    notePatterns: [
      {
        pattern: /Source:\s*([^\n]+)/i,
        label: "Source",
      },
    ],
  },
];

export const cleanResult = (result) => {
  if (!result) return "";
  return result.replace(/\s*\d{4}-\d{2}-\d{2}\s*\*?[A-Z]?/g, "").trim();
};

export const standardizeResult = (result, testType) => {
  result = cleanResult(result);
  const lowerResult = result.toLowerCase().trim();

  // Special handling for HIV interpretation
  if (
    testType === "HIV Final Interpretation" ||
    testType === "HIV 1/2 Ag/Ab Combo Screen"
  ) {
    if (
      lowerResult.includes("no hiv") &&
      lowerResult.includes("antibodies detected")
    ) {
      return { result: TEST_RESULTS.NOT_DETECTED };
    }
    if (lowerResult.includes("hiv") && lowerResult.includes("detected")) {
      return { result: TEST_RESULTS.DETECTED };
    }
  }

  // Special handling for HSV interpretation
  if (testType === "Herpes Simplex Virus Interpretation") {
    if (lowerResult.includes("antibodies detected")) {
      return { result: TEST_RESULTS.DETECTED };
    }
    if (lowerResult.includes("no antibodies detected")) {
      return { result: TEST_RESULTS.NOT_DETECTED };
    }
  }

  // Handle numeric values
  if (/^[\d.]+\s*[a-zA-Z/]+$/.test(result)) {
    return {
      result: result,
      value: result,
    };
  }

  if (/^non-reactive$|^non reactive|^nonreactive$/i.test(lowerResult)) {
    return { result: TEST_RESULTS.NON_REACTIVE };
  }

  if (/evidence of immunity/i.test(lowerResult)) {
    return { result: TEST_RESULTS.IMMUNE };
  }

  if (/no evidence of hepatitis b virus infection/i.test(lowerResult)) {
    return { result: TEST_RESULTS.NEGATIVE };
  }

  if (/^negative$|no evidence|absent|not detected/i.test(lowerResult)) {
    return { result: TEST_RESULTS.NEGATIVE };
  }

  if (/^positive$|^reactive|detected$/i.test(lowerResult)) {
    return { result: TEST_RESULTS.POSITIVE };
  }

  if (/borderline|unclear|equivocal/.test(lowerResult)) {
    return { result: TEST_RESULTS.INDETERMINATE };
  }

  // Log unmatched results
  console.log(`No standardization match found for: "${lowerResult}"`);
  return { result: TEST_RESULTS.INDETERMINATE };
};

const extractTestNotes = (text, testConfig) => {
  const notes = []; // Initialize notes array here

  testConfig.notePatterns.forEach(({ pattern, label }) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Access captured group [1]
      const value = match[1].trim().replace(/\s+/g, " ");
      if (value) {
        notes.push(`${label}: ${value}`);
      }
    }
  });

  const volumeWarning = text.match(/Please note that the volume[^.]+\./);
  if (volumeWarning) {
    notes.push(`Lab Note: ${volumeWarning[0].trim()}`); // Access matched group [0]
  }

  return notes.join(" | ");
};

export const extractDateFromText = (text) => {
  const dateRegex =
    /(?:DATE OF COLLECTION|Collection Date:?)\s*(\d{2}-[A-Z]{3}-\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/i;
  const match = text.match(dateRegex);

  if (match && match[1]) {
    return match[1];
  }

  // Fallback to original broader date search if specific format not found
  const generalDateRegex =
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)|(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})|(\d{2}-\d{2}-\d{4})|(\d{2}-[A-Z]{3}-\d{4})|(\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4})/gi;
  const matches = text.match(generalDateRegex);

  if (matches) {
    const currentDate = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(currentDate.getFullYear() - 3);

    for (const match of matches) {
      const date = new Date(match);
      if (!isNaN(date.getTime()) && date >= threeYearsAgo) {
        return match;
      }
    }
  }

  return null;
};

export const findTestResults = (text) => {
  const results = []; // Initialize results array here
  const textBlock = typeof text === "string" ? text : text.toString();

  STI_TESTS.forEach((test) => {
    try {
      const match = textBlock.match(test.regex);

      if (match) {
        const rawResult = match
          .slice(1)
          .find((group) => group !== undefined)
          ?.trim();
        if (rawResult) {
          const { result } = standardizeResult(rawResult, test.name);
          const standardizedResult = result || TEST_RESULTS.INDETERMINATE;

          const contextStart = Math.max(0, match.index - 500);
          const contextEnd = Math.min(textBlock.length, match.index + 500);
          const context = textBlock.slice(contextStart, contextEnd);

          const notes = extractTestNotes(context, test);

          results.push({
            test_type: test.name,
            result: standardizedResult,
            notes: notes || "No additional notes",
          });
        }
      }
    } catch (error) {
      console.error(`Error processing test ${test.name}:`, error);
    }
  });

  return results;
};
