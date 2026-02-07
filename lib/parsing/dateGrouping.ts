// Pure function to group parsed documents by collection date
// No React dependencies - independently testable

import type { STIResult, TestStatus } from '../types';
import type { TestConflict } from './testDeduplicator';
import { deduplicateTestResults } from './testDeduplicator';
import { determineTestType } from './documentParser';

// ---------------------------------------------------------------------------
// Input type: represents a single parsed document with its metadata.
// This mirrors the shape that processParseResults in upload.tsx receives
// for each successfully parsed document. Documents that failed parsing
// (with an error field) should be filtered out before calling this function.
// ---------------------------------------------------------------------------

export interface ParsedDocumentForGrouping {
  collectionDate: string | null;
  testType?: string | null;
  tests: Array<{ name: string; result: string; status: TestStatus }>;
  notes?: string;
  isVerified: boolean;
  verificationDetails?: {
    labName?: string;
    patientName?: string;
    hasHealthCard: boolean;
    hasAccessionNumber: boolean;
    nameMatched: boolean;
  };
}

// ---------------------------------------------------------------------------
// Output type: a single date group containing merged results from all
// documents that share the same collection date.
// ---------------------------------------------------------------------------

export interface DateGroupedResult {
  /** YYYY-MM-DD or null for documents with unknown dates */
  date: string | null;
  /** Deduplicated test results for this date group */
  tests: STIResult[];
  /** Computed test type based on the tests in this group */
  testType: string;
  /** Overall status computed from this group's tests */
  overallStatus: TestStatus;
  /** Whether any document in this group was verified */
  isVerified: boolean;
  /** Verification details from all verified documents in this group */
  verificationDetails: Array<{
    labName?: string;
    patientName?: string;
    hasHealthCard: boolean;
    hasAccessionNumber: boolean;
    nameMatched: boolean;
  }>;
  /** Combined notes from all documents in this group */
  notes: string;
  /** Test conflicts detected during deduplication within this group */
  conflicts: TestConflict[];
  /** Indices of the original documents that contributed to this group */
  sourceDocIndices: number[];
}

// ---------------------------------------------------------------------------
// Internal accumulator used while building each date group
// ---------------------------------------------------------------------------

interface DateGroupAccumulator {
  tests: STIResult[];
  verified: boolean;
  verificationDetails: Array<{
    labName?: string;
    patientName?: string;
    hasHealthCard: boolean;
    hasAccessionNumber: boolean;
    nameMatched: boolean;
  }>;
  notes: string[];
  detectedTestType: string | null;
  sourceDocIndices: number[];
}

// Sentinel key for documents that have no collection date
const NO_DATE_KEY = '__no_date__';

/**
 * Computes the overall status from a set of test results.
 *
 * Logic mirrors what processParseResults does in upload.tsx:
 * - If any test is positive, overall is "positive"
 * - If all tests are negative, overall is "negative"
 * - Otherwise (mix of pending/inconclusive), overall is "pending"
 */
function computeOverallStatus(tests: STIResult[]): TestStatus {
  if (tests.length === 0) {
    return 'pending';
  }

  const anyPositive = tests.some((t) => t.status === 'positive');
  if (anyPositive) return 'positive';

  const allNegative = tests.every((t) => t.status === 'negative');
  if (allNegative) return 'negative';

  return 'pending';
}

/**
 * Creates a fresh accumulator for a new date group.
 */
function createAccumulator(): DateGroupAccumulator {
  return {
    tests: [],
    verified: false,
    verificationDetails: [],
    notes: [],
    detectedTestType: null,
    sourceDocIndices: [],
  };
}

/**
 * Derives the map key for a given collection date.
 * Null/undefined dates all map to the same sentinel key.
 */
function dateToKey(date: string | null | undefined): string {
  return date || NO_DATE_KEY;
}

/**
 * Groups an array of parsed documents by their collection date.
 *
 * For each date group the function:
 * 1. Merges all tests from documents sharing that date
 * 2. Deduplicates tests within the group (using the existing deduplication logic)
 * 3. Determines the test type based on the deduplicated tests
 * 4. Computes an overall status from the deduplicated tests
 * 5. Merges verification details (deduplicating by lab name)
 * 6. Concatenates notes from all contributing documents
 *
 * Documents with null/undefined collection dates are grouped together
 * into a single "date unknown" group.
 *
 * This is a pure function with no side effects.
 *
 * @param parsedDocuments - Successfully parsed documents (errors should be filtered out beforehand)
 * @returns An array of DateGroupedResult, one per unique collection date
 */
export function groupParsedDocumentsByDate(
  parsedDocuments: ParsedDocumentForGrouping[]
): DateGroupedResult[] {
  if (parsedDocuments.length === 0) {
    return [];
  }

  // Phase 1: Accumulate documents into date-keyed buckets
  const dateMap = new Map<string, DateGroupAccumulator>();

  parsedDocuments.forEach((doc, index) => {
    const key = dateToKey(doc.collectionDate);
    const accumulator = dateMap.get(key) || createAccumulator();

    // Track which original document index contributed to this group
    accumulator.sourceDocIndices.push(index);

    // Collect the first non-null test type per group (matching processParseResults pattern)
    if (!accumulator.detectedTestType && doc.testType) {
      accumulator.detectedTestType = doc.testType;
    }

    // Collect notes
    if (doc.notes) {
      accumulator.notes.push(doc.notes);
    }

    // Merge verification state
    if (doc.isVerified) {
      accumulator.verified = true;
    }
    if (doc.verificationDetails) {
      // Deduplicate verification details by lab name (same logic as processParseResults)
      const labName = doc.verificationDetails.labName;
      const alreadyHasLab = accumulator.verificationDetails.some(
        (v) => v.labName === labName
      );
      if (!alreadyHasLab) {
        accumulator.verificationDetails.push(doc.verificationDetails);
      }
    }

    // Collect all tests as STIResult objects
    if (doc.tests && doc.tests.length > 0) {
      const results: STIResult[] = doc.tests.map((t) => ({
        name: t.name,
        result: t.result,
        status: t.status,
      }));
      accumulator.tests.push(...results);
    }

    dateMap.set(key, accumulator);
  });

  // Phase 2: Transform each accumulated bucket into a DateGroupedResult
  const groups: DateGroupedResult[] = [];

  for (const [key, accumulator] of dateMap) {
    const date = key === NO_DATE_KEY ? null : key;

    if (accumulator.tests.length > 0) {
      // Deduplicate within this group
      const deduplicationResult = deduplicateTestResults(accumulator.tests);

      // Determine test type from deduplicated tests
      const testType = determineTestType(deduplicationResult.tests);

      groups.push({
        date,
        tests: deduplicationResult.tests,
        testType,
        overallStatus: computeOverallStatus(deduplicationResult.tests),
        isVerified: accumulator.verified,
        verificationDetails: accumulator.verificationDetails,
        notes: accumulator.notes.join('\n\n'),
        conflicts: deduplicationResult.conflicts,
        sourceDocIndices: accumulator.sourceDocIndices,
      });
    } else {
      // Group has no tests (all documents had empty test arrays)
      // Still include the group so callers know about the documents
      groups.push({
        date,
        tests: [],
        testType: accumulator.detectedTestType || 'STI Panel',
        overallStatus: 'pending',
        isVerified: accumulator.verified,
        verificationDetails: accumulator.verificationDetails,
        notes: accumulator.notes.join('\n\n'),
        conflicts: [],
        sourceDocIndices: accumulator.sourceDocIndices,
      });
    }
  }

  return groups;
}
