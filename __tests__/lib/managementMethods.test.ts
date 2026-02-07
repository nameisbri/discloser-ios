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

  test("returns only universal methods for Hepatitis B", () => {
    const methods = getMethodsForCondition("Hepatitis B");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids).not.toContain("daily_antivirals");
    expect(ids).not.toContain("prep");
  });

  test("returns only universal methods for Hepatitis C", () => {
    const methods = getMethodsForCondition("Hepatitis C");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids.length).toBe(2);
  });

  test("returns universal methods for unknown conditions", () => {
    const methods = getMethodsForCondition("Something Else");
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("barriers");
    expect(ids).toContain("regular_monitoring");
    expect(ids.length).toBe(2);
  });
});

describe("getMethodLabel", () => {
  test("returns correct label for known method IDs", () => {
    expect(getMethodLabel("daily_antivirals")).toBe("Daily antivirals");
    expect(getMethodLabel("prep")).toBe("PrEP");
    expect(getMethodLabel("art_treatment")).toBe("ART treatment");
    expect(getMethodLabel("undetectable")).toBe("Undetectable viral load");
    expect(getMethodLabel("barriers")).toBe("Barrier use");
    expect(getMethodLabel("regular_monitoring")).toBe("Regular monitoring");
    expect(getMethodLabel("supplements")).toBe("Supplements");
    expect(getMethodLabel("antiviral_as_needed")).toBe("Antivirals as needed");
  });

  test("returns ID itself for unknown method", () => {
    expect(getMethodLabel("unknown_method")).toBe("unknown_method");
  });
});

describe("MANAGEMENT_METHODS", () => {
  test("has 8 methods defined", () => {
    expect(MANAGEMENT_METHODS).toHaveLength(8);
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
