/**
 * Lab Name Normalizer Usage Example
 *
 * This file demonstrates how to integrate the lab name normalizer
 * into the document verification workflow.
 *
 * DO NOT IMPORT THIS FILE IN PRODUCTION CODE - IT IS FOR DOCUMENTATION ONLY
 */

import { matchesCanadianLab } from './labNameNormalizer';

/**
 * Example: How to use in documentParser.ts
 *
 * BEFORE (exact substring matching - fails on variations):
 * ```typescript
 * const labName = llm.lab_name?.toLowerCase() || '';
 * const isRecognizedLab = CANADIAN_LABS.some(lab => labName.includes(lab));
 * ```
 *
 * AFTER (flexible matching - handles variations):
 * ```typescript
 * const isRecognizedLab = matchesCanadianLab(llm.lab_name || '');
 * ```
 *
 * This change enables the following LLM variations to be recognized:
 * - "Public Health Ontario Laboratory" ✓ (was failing before)
 * - "PHO" ✓ (was failing before)
 * - "LifeLabs Medical Laboratory Services" ✓ (was failing before)
 * - "Alberta Precision Laboratories" ✓ (was failing before)
 * - "Life Labs" ✓ (was failing before - spacing variation)
 * - All exact matches continue to work ✓
 */

export function verifyDocumentExample(llm: { lab_name?: string }) {
  // New implementation with flexible matching
  const isRecognizedLab = matchesCanadianLab(llm.lab_name || '');

  console.log(`Lab name: "${llm.lab_name}"`);
  console.log(`Recognized: ${isRecognizedLab}`);

  return isRecognizedLab;
}

// Example usage
if (require.main === module) {
  const testCases = [
    { lab_name: 'Public Health Ontario Laboratory' },
    { lab_name: 'PHO' },
    { lab_name: 'LifeLabs Medical Laboratory' },
    { lab_name: 'Alberta Precision Laboratories' },
    { lab_name: 'Dynacare' },
    { lab_name: 'Unknown Lab Inc' },
  ];

  console.log('Lab Name Recognition Test Results:');
  console.log('===================================\n');

  testCases.forEach(testCase => {
    verifyDocumentExample(testCase);
    console.log('');
  });
}
