export interface KnownCondition {
  condition: string;
  added_at: string;
  notes?: string;
  management_methods?: string[];
}

export function matchesKnownCondition(
  stiName: string,
  knownConditions: KnownCondition[]
): KnownCondition | undefined {
  const name = stiName.toLowerCase();
  return knownConditions.find((kc) => {
    const cond = kc.condition.toLowerCase();
    if (cond === name) return true;
    if (
      (cond.includes("hsv-1") || cond.includes("hsv1")) &&
      (name.includes("hsv-1") ||
        name.includes("hsv1") ||
        name.includes("herpes simplex virus 1") ||
        name.includes("simplex 1") ||
        name === "herpes")
    )
      return true;
    if (
      (cond.includes("hsv-2") || cond.includes("hsv2")) &&
      (name.includes("hsv-2") ||
        name.includes("hsv2") ||
        name.includes("herpes simplex virus 2") ||
        name.includes("simplex 2") ||
        name === "herpes")
    )
      return true;
    if (cond.includes("hiv") && name.includes("hiv")) return true;
    if (
      (cond.includes("hepatitis b") ||
        cond.includes("hep b") ||
        cond.includes("hbv")) &&
      (name.includes("hepatitis b") ||
        name.includes("hep b") ||
        name.includes("hbv"))
    )
      return true;
    if (
      (cond.includes("hepatitis c") ||
        cond.includes("hep c") ||
        cond.includes("hcv")) &&
      (name.includes("hepatitis c") ||
        name.includes("hep c") ||
        name.includes("hcv"))
    )
      return true;
    // HPV variations
    if (
      (cond.includes("hpv") || cond.includes("papilloma")) &&
      (name.includes("hpv") ||
        name.includes("papilloma") ||
        name.includes("human papilloma"))
    )
      return true;
    return false;
  });
}
