import { getMethodsForCondition, getMethodLabel, MANAGEMENT_METHODS } from "../../lib/managementMethods";

describe("getMethodsForCondition", () => {
  test("returns HIV-specific methods for HIV-1/2", () => {
    const methods = getMethodsForCondition("HIV-1/2");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("prep");
    expect(ids).toContain("art_treatment");
    expect(ids).toContain("undetectable");
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids).not.toContain("daily_antivirals");
    expect(ids).not.toContain("supplements");
  });

  test("returns HSV-specific methods for Herpes (HSV-1)", () => {
    const methods = getMethodsForCondition("Herpes (HSV-1)");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("daily_antivirals");
    expect(ids).toContain("antiviral_as_needed");
    expect(ids).toContain("supplements");
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids).not.toContain("prep");
    expect(ids).not.toContain("art_treatment");
  });

  test("returns HSV-specific methods for Herpes (HSV-2)", () => {
    const methods = getMethodsForCondition("Herpes (HSV-2)");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("daily_antivirals");
    expect(ids).toContain("antiviral_as_needed");
    expect(ids).toContain("supplements");
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
  });

  test("returns Hepatitis B methods for Hepatitis B", () => {
    const methods = getMethodsForCondition("Hepatitis B");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("antiviral_treatment");
    expect(ids).toContain("liver_monitoring");
    expect(ids).toContain("vaccinated");
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids).not.toContain("daily_antivirals");
    expect(ids).not.toContain("prep");
    expect(ids).not.toContain("cured");
    expect(ids).not.toContain("regular_screening");
  });

  test("returns Hepatitis C methods for Hepatitis C", () => {
    const methods = getMethodsForCondition("Hepatitis C");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("antiviral_treatment");
    expect(ids).toContain("liver_monitoring");
    expect(ids).toContain("cured");
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids).not.toContain("vaccinated");
    expect(ids).not.toContain("daily_antivirals");
    expect(ids).not.toContain("prep");
  });

  test("returns HPV methods for HPV", () => {
    const methods = getMethodsForCondition("HPV");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("vaccinated");
    expect(ids).toContain("regular_screening");
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids).not.toContain("daily_antivirals");
    expect(ids).not.toContain("prep");
    expect(ids).not.toContain("antiviral_treatment");
    expect(ids).not.toContain("cured");
  });

  test("returns universal methods for unknown conditions", () => {
    const methods = getMethodsForCondition("Something Else");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids.length).toBe(2);
  });

  // Regex matching tests — abbreviations and variations
  test("matches Hepatitis B by abbreviation HBV", () => {
    const methods = getMethodsForCondition("HBV");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("antiviral_treatment");
    expect(ids).toContain("liver_monitoring");
    expect(ids).toContain("vaccinated");
    expect(ids).toContain("barriers");
  });

  test("matches Hepatitis B by short form Hep B", () => {
    const methods = getMethodsForCondition("Hep B");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("antiviral_treatment");
    expect(ids).toContain("liver_monitoring");
    expect(ids).toContain("vaccinated");
  });

  test("matches Hepatitis C by abbreviation HCV", () => {
    const methods = getMethodsForCondition("HCV");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("antiviral_treatment");
    expect(ids).toContain("liver_monitoring");
    expect(ids).toContain("cured");
    expect(ids).toContain("barriers");
  });

  test("matches Hepatitis C by short form Hep C", () => {
    const methods = getMethodsForCondition("Hep C");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("antiviral_treatment");
    expect(ids).toContain("cured");
  });

  test("matches HPV by full name Human Papillomavirus", () => {
    const methods = getMethodsForCondition("Human Papillomavirus");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("vaccinated");
    expect(ids).toContain("regular_screening");
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
  });

  test("does not cross-match Hepatitis B methods for Hepatitis C", () => {
    const methods = getMethodsForCondition("Hepatitis C");
    const ids = methods.map((m) => m.id);
    expect(ids).not.toContain("vaccinated");
  });

  test("does not cross-match Hepatitis C methods for Hepatitis B", () => {
    const methods = getMethodsForCondition("Hepatitis B");
    const ids = methods.map((m) => m.id);
    expect(ids).not.toContain("cured");
  });

  test("does not cross-match HPV methods for HIV", () => {
    const methods = getMethodsForCondition("HIV-1/2");
    const ids = methods.map((m) => m.id);
    expect(ids).not.toContain("vaccinated");
    expect(ids).not.toContain("regular_screening");
  });
});

describe("getMethodLabel", () => {
  test("returns correct label for existing method IDs", () => {
    expect(getMethodLabel("daily_antivirals")).toBe("Daily antivirals");
    expect(getMethodLabel("prep")).toBe("PrEP");
    expect(getMethodLabel("art_treatment")).toBe("ART treatment");
    expect(getMethodLabel("undetectable")).toBe("Undetectable viral load");
    expect(getMethodLabel("barriers")).toBe("Barrier use");
    expect(getMethodLabel("regular_monitoring")).toBe("Regular monitoring");
    expect(getMethodLabel("supplements")).toBe("Supplements");
    expect(getMethodLabel("antiviral_as_needed")).toBe("Antivirals as needed");
  });

  test("returns correct label for new method IDs", () => {
    expect(getMethodLabel("antiviral_treatment")).toBe("Antiviral treatment");
    expect(getMethodLabel("liver_monitoring")).toBe("Liver function monitoring");
    expect(getMethodLabel("vaccinated")).toBe("Vaccinated");
    expect(getMethodLabel("cured")).toBe("Completed treatment / cured");
    expect(getMethodLabel("regular_screening")).toBe("Regular screening");
  });

  test("returns ID itself for unknown method", () => {
    expect(getMethodLabel("unknown_method")).toBe("unknown_method");
  });
});

describe("MANAGEMENT_METHODS", () => {
  test("has 13 methods defined", () => {
    expect(MANAGEMENT_METHODS).toHaveLength(13);
  });

  test("each method has required fields", () => {
    for (const method of MANAGEMENT_METHODS) {
      expect(method.id).toBeTruthy();
      expect(method.label).toBeTruthy();
      expect(method.applicableTo).toBeDefined();
      expect(method.applicableTo.length).toBeGreaterThan(0);
    }
  });

  test("all method IDs are unique", () => {
    const ids = MANAGEMENT_METHODS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
