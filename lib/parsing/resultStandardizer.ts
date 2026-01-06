// Standardizes varied result text to consistent status

import type { TestStatus } from "../types";

export type StandardizedResult = {
  status: TestStatus;
  displayText: string;
};

const NEGATIVE_PATTERNS = [
  /^negative$/i,
  /^non[- ]?reactive$/i,
  /^not detected$/i,
  /^no evidence/i,
  /^absent$/i,
  /antibodies not detected/i,
  /not infected/i,
];

const POSITIVE_PATTERNS = [
  /^positive$/i,
  /^reactive$/i,
  /^detected$/i,
  /antibodies detected/i,
  /evidence of infection/i,
];

const IMMUNE_PATTERNS = [
  /evidence of immunity/i,
  /immune status/i,
  /protective/i,
];

export function standardizeResult(rawResult: string): StandardizedResult {
  if (!rawResult) return { status: "pending", displayText: "Unknown" };
  
  const text = rawResult.trim();
  const lower = text.toLowerCase();
  
  // Check negative patterns
  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(lower)) {
      return { status: "negative", displayText: "Negative" };
    }
  }
  
  // Check positive patterns
  for (const pattern of POSITIVE_PATTERNS) {
    if (pattern.test(lower)) {
      return { status: "positive", displayText: "Positive" };
    }
  }
  
  // Immune = negative for our purposes
  for (const pattern of IMMUNE_PATTERNS) {
    if (pattern.test(lower)) {
      return { status: "negative", displayText: "Immune" };
    }
  }
  
  // Numeric values (e.g., "101.16 mIU/mL") - keep as-is, mark pending
  if (/^[\d.]+\s*[a-zA-Z/]+/.test(text)) {
    return { status: "pending", displayText: text };
  }
  
  return { status: "pending", displayText: text };
}

export function determineOverallStatus(statuses: TestStatus[]): TestStatus {
  if (statuses.some(s => s === "positive")) return "positive";
  if (statuses.some(s => s === "pending")) return "pending";
  return "negative";
}

