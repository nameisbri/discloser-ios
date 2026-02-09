// Main document parser - orchestrates text extraction and LLM parsing

import { parseDocumentWithLLM } from './llmParser';
import { normalizeTestName } from './testNormalizer';
import { standardizeResult } from './resultStandardizer';
import { extractTextFromPDF, isPDFExtractionAvailable } from './pdfParser';
import { DocumentParsingError, extractTextFromImage } from './ocrExtractor';
import { ParsedDocument, ParsedTest, LLMResponse, UserProfileForVerification, VerificationResult, VerificationCheck, VerificationLevel } from './types';
import { findLabByName } from '../utils/canadianLabDatabase';
import { validateCollectionDate } from '../utils/dateValidator';
import { generateContentHash } from '../utils/contentHash';
import { logger } from '../utils/logger';
import { isNetworkRequestError } from '../http';

// Re-export for API compatibility
export { DocumentParsingError, extractTextFromImage } from './ocrExtractor';

/**
 * Main function to parse an image and extract STI test results
 * @param uri - Image URI to parse
 * @param mimeType - MIME type of the image
 * @param userProfile - Optional user profile for name verification matching
 * @param fileIdentifier - Optional identifier for the file (e.g., "File 1 of 3") for multi-file scenarios
 * @throws {DocumentParsingError} When any step of the parsing process fails
 */
export async function parseDocument(
  uri: string,
  mimeType: string,
  userProfile?: UserProfileForVerification,
  fileIdentifier?: string
): Promise<ParsedDocument> {
  const logContext = { fileIdentifier, uri: uri.substring(0, 50), mimeType };

  try {
    logger.info('Starting document parsing', logContext);

    // Step 1: Extract text based on document type
    let extractedText: string;

    if (mimeType === 'application/pdf') {
      // PDF extraction using native APIs
      logger.info('Starting PDF text extraction', logContext);

      if (!isPDFExtractionAvailable()) {
        throw new DocumentParsingError(
          'pdf_extraction',
          'PDF extraction is not available. Please use a development build.',
          { fileIdentifier }
        );
      }

      const pdfResult = await extractTextFromPDF(uri, { fileIdentifier });

      if (!pdfResult.success) {
        throw new DocumentParsingError(
          'pdf_extraction',
          pdfResult.error || 'Failed to extract text from PDF',
          {
            fileIdentifier,
            details: {
              pageCount: pdfResult.pageCount,
              pagesProcessed: pdfResult.pagesProcessed,
              extractionMethod: pdfResult.extractionMethod,
            },
          }
        );
      }

      extractedText = pdfResult.text;
      logger.info('PDF text extraction successful', {
        ...logContext,
        textLength: extractedText.length,
        pageCount: pdfResult.pageCount,
        pagesProcessed: pdfResult.pagesProcessed,
      });
    } else {
      // Image extraction using OCR
      logger.info('Starting image text extraction (OCR)', logContext);
      extractedText = await extractTextFromImage(uri, fileIdentifier);
      logger.info('OCR text extraction successful', {
        ...logContext,
        textLength: extractedText.length,
      });
    }

    // Step 2: Parse with LLM
    logger.info('Starting LLM parsing', logContext);
    let llmResponse: LLMResponse;
    try {
      llmResponse = await parseDocumentWithLLM(extractedText);
      logger.info('LLM parsing successful', {
        ...logContext,
        testsFound: llmResponse.tests.length,
        testType: llmResponse.test_type,
      });
    } catch (error) {
      logger.error('LLM parsing failed', { ...logContext, error });

      // Classify LLM parsing errors
      if (isNetworkRequestError(error)) {
        throw new DocumentParsingError(
          'network',
          `Network error during LLM parsing: ${error.message}`,
          {
            fileIdentifier,
            originalError: error,
            details: {
              statusCode: error.statusCode,
              errorType: error.type,
            },
          }
        );
      }

      throw new DocumentParsingError(
        'llm_parsing',
        `Failed to parse document with LLM: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          fileIdentifier,
          originalError: error,
        }
      );
    }

    // Step 3: Normalize and standardize results
    logger.info('Starting normalization and standardization', logContext);
    let tests: ParsedTest[];
    try {
      tests = llmResponse.tests.map((test) => {
        const normalizedName = normalizeTestName(test.name);
        const status = standardizeResult(test.result);

        return {
          name: normalizedName,
          result: test.result,
          status,
          notes: test.notes,
        };
      });

      logger.info('Normalization successful', {
        ...logContext,
        processedTests: tests.length,
      });
    } catch (error) {
      logger.error('Normalization failed', { ...logContext, error });

      throw new DocumentParsingError(
        'normalization',
        `Failed to normalize test results: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          fileIdentifier,
          originalError: error,
        }
      );
    }

    // Step 4: Determine test type - use our logic for comprehensive panels, otherwise trust LLM
    const determinedType = determineTestType(tests);
    const testType = determinedType === 'Full STI Panel' ? determinedType : (llmResponse.test_type || determinedType);

    // Step 5: Format collection date
    const collectionDate = formatDate(llmResponse.collection_date);

    // Step 6: Calculate verification confidence score
    const verificationResult = calculateVerificationScore(llmResponse, userProfile, new Date());

    // Step 7: Generate content hash for duplicate detection
    let contentHash: string | undefined;
    let contentSimhash: string | undefined;
    try {
      const hashResult = await generateContentHash(extractedText);
      contentHash = hashResult.hash;
      contentSimhash = hashResult.simhash;
    } catch (error) {
      logger.error('Content hash generation failed', { ...logContext, error });
      // Non-fatal: continue without hash
    }

    logger.info('Document parsing complete', {
      ...logContext,
      testType,
      testCount: tests.length,
      isVerified: verificationResult.isVerified,
      verificationScore: verificationResult.score,
      verificationLevel: verificationResult.level,
      collectionDate,
    });

    // Build legacy verificationDetails from scoring checks for UI backward compat
    const nameCheck = verificationResult.checks.find(c => c.name === 'name_match');
    const verificationDetails = {
      labName: llmResponse.lab_name,
      patientName: llmResponse.patient_name,
      hasHealthCard: llmResponse.health_card_present === true,
      hasAccessionNumber: !!llmResponse.accession_number,
      nameMatched: nameCheck?.passed ?? false,
    };

    return {
      collectionDate,
      testType,
      tests,
      notes: llmResponse.notes,
      rawText: extractedText.substring(0, 500),
      isVerified: verificationResult.isVerified,
      verificationDetails,
      verificationResult,
      contentHash,
      contentSimhash,
    };
  } catch (error) {
    // Re-throw DocumentParsingError as-is (already properly formatted)
    if (error instanceof DocumentParsingError) {
      logger.error('Document parsing failed', {
        ...logContext,
        step: error.step,
        errorMessage: error.message,
        userMessage: error.getUserMessage(),
      });
      throw error;
    }

    // Wrap unexpected errors
    logger.error('Unexpected error during document parsing', {
      ...logContext,
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    throw new DocumentParsingError(
      'unknown',
      `Unexpected error during document parsing: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        fileIdentifier,
        originalError: error,
      }
    );
  }
}

/**
 * Determines the overall test type based on tests found
 */
export function determineTestType(tests: Array<{ name: string }>): string {
  const categories = new Set<string>();

  for (const test of tests) {
    const name = test.name.toLowerCase();
    if (name.includes('hiv')) categories.add('HIV');
    if (name.includes('hepatitis a') || name.includes('hep a') || name === 'hav') categories.add('Hepatitis A');
    if (name.includes('hepatitis b') || name.includes('hep b') || name === 'hbv') categories.add('Hepatitis B');
    if (name.includes('hepatitis c') || name.includes('hep c') || name === 'hcv') categories.add('Hepatitis C');
    if (name.includes('syphilis') || name.includes('rpr') || name.includes('vdrl')) categories.add('Syphilis');
    if (name.includes('gonorrhea') || name.includes('gc') || name.includes('neisseria')) categories.add('Gonorrhea');
    if (name.includes('chlamydia') || name.includes('ct')) categories.add('Chlamydia');
    if (name.includes('herpes') || name.includes('hsv')) categories.add('Herpes');
  }

  // 4+ categories = full panel
  if (categories.size >= 4) {
    return 'Full STI Panel';
  }

  // 2-3 categories = combined name
  if (categories.size >= 2) {
    const cats = [...categories].slice(0, 3);
    return cats.join(' & ') + ' Panel';
  }

  // Single category
  if (categories.size === 1) {
    return [...categories][0] + ' Test';
  }

  return 'STI Panel';
}

/**
 * Formats date to YYYY-MM-DD
 */
function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;

  try {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Parse and use UTC to avoid timezone shifts
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    logger.error('Date formatting error', { error });
    return null;
  }
}

/**
 * Normalizes a name for comparison: strip accents, lowercase, remove punctuation, collapse spaces.
 */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics (é→e, ã→a, ç→c)
    .toLowerCase()
    .replace(/[,.\-_']/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Checks if the extracted patient name matches the user's profile name
 * Uses fuzzy matching - names don't need to be in exact order
 */
function matchNames(extractedName: string | undefined, userProfile?: UserProfileForVerification): boolean {
  if (!extractedName || !userProfile) return false;
  if (!userProfile.first_name && !userProfile.last_name) return false;

  const normalizedExtracted = normalizeName(extractedName);
  const extractedParts = normalizedExtracted.split(' ').filter(p => p.length >= 2);

  // Build user name parts (skip single-char parts like initials to avoid false matches)
  const userParts: string[] = [];
  if (userProfile.first_name) {
    userParts.push(...normalizeName(userProfile.first_name).split(' ').filter(p => p.length >= 2));
  }
  if (userProfile.last_name) {
    userParts.push(...normalizeName(userProfile.last_name).split(' ').filter(p => p.length >= 2));
  }

  if (userParts.length === 0) return false;

  // Check if all user name parts appear in the extracted name
  // This handles name order differences (e.g., "Smith John" vs "John Smith")
  // Require exact or substring match with a minimum 3-char overlap to avoid false positives
  const matchedParts = userParts.filter(part =>
    extractedParts.some(extracted => {
      if (extracted === part) return true;
      // Only allow substring matching for parts with 3+ characters
      if (part.length >= 3 && extracted.includes(part)) return true;
      if (extracted.length >= 3 && part.includes(extracted)) return true;
      return false;
    })
  );

  // Require at least 2 parts to match (first + last), or all parts if user only has 1-2
  const requiredMatches = Math.min(2, userParts.length);
  return matchedParts.length >= requiredMatches;
}


/**
 * Maps a numeric verification score to a level label.
 */
function scoreToLevel(score: number): VerificationLevel {
  if (score >= 75) return 'high';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'low';
  if (score >= 1) return 'unverified';
  return 'self_reported';
}

/**
 * Calculates a multi-factor verification confidence score (0-100) for a parsed document.
 *
 * Scoring rubric (7 checks, 100 points total):
 *  1. recognized_lab          – 25 pts – Lab matches Canadian lab database
 *  2. health_card             – 20 pts – Health card number detected
 *  3. accession_number        – 15 pts – Lab accession/requisition number present
 *  4. name_match              – 15 pts – Patient name matches user profile
 *  5. collection_date         – 10 pts – Valid, non-future collection date
 *  6. structural_completeness – 10 pts – Has test results and test type
 *  7. multi_signal_agreement  –  5 pts – 3+ independent signals agree
 *
 * Level thresholds:
 *  75-100 = high  |  50-74 = moderate  |  25-49 = low  |  1-24 = unverified  |  0 = self_reported
 *
 * Backward compatibility: `isVerified = score >= 60`
 */
export function calculateVerificationScore(
  llm: LLMResponse,
  userProfile?: UserProfileForVerification,
  uploadTimestamp?: Date,
): VerificationResult {
  const checks: VerificationCheck[] = [];

  // Check 1: Recognized lab (25 points)
  const labMatch = findLabByName(llm.lab_name || '');
  checks.push({
    name: 'recognized_lab',
    passed: !!labMatch,
    points: labMatch ? 25 : 0,
    maxPoints: 25,
    details: labMatch ? `Matched: ${labMatch.canonicalName}` : 'Lab not recognized',
  });

  // Check 2: Health card present (20 points)
  const hasHealthCard = llm.health_card_present === true;
  checks.push({
    name: 'health_card',
    passed: hasHealthCard,
    points: hasHealthCard ? 20 : 0,
    maxPoints: 20,
    details: hasHealthCard ? 'Health card number detected' : 'No health card detected',
  });

  // Check 3: Accession number (15 points)
  // Full 15 pts if format matches known lab pattern, 8 pts if present but unverified format
  const hasAccession = !!llm.accession_number;
  let accessionPoints = 0;
  let accessionDetail = 'No accession number detected';
  if (hasAccession && labMatch?.accessionFormat) {
    const formatMatch = labMatch.accessionFormat.test(llm.accession_number!);
    if (formatMatch) {
      accessionPoints = 15;
      accessionDetail = `Accession matches ${labMatch.canonicalName} format`;
    } else {
      accessionPoints = 8;
      accessionDetail = `Accession present but format doesn't match ${labMatch.canonicalName}`;
    }
  } else if (hasAccession) {
    accessionPoints = 8;
    accessionDetail = `Accession present: ${llm.accession_number}`;
  }
  checks.push({
    name: 'accession_number',
    passed: hasAccession,
    points: accessionPoints,
    maxPoints: 15,
    details: accessionDetail,
  });

  // Check 4: Name match (15 points)
  const nameMatched = matchNames(llm.patient_name, userProfile);
  checks.push({
    name: 'name_match',
    passed: nameMatched,
    points: nameMatched ? 15 : 0,
    maxPoints: 15,
    details: userProfile
      ? (nameMatched ? 'Patient name matches profile' : 'Patient name does not match profile')
      : 'No user profile provided for name matching',
  });

  // Check 5: Collection date validity (10 points)
  const dateValidation = validateCollectionDate(llm.collection_date, uploadTimestamp);
  const dateValid = dateValidation.isValid && !dateValidation.isFuture;
  checks.push({
    name: 'collection_date',
    passed: dateValid,
    points: dateValid ? 10 : 0,
    maxPoints: 10,
    details: dateValidation.details,
  });

  // Check 6: Structural completeness (10 points)
  const hasTests = llm.tests && llm.tests.length > 0;
  const hasTestType = !!llm.test_type;
  const structurallyComplete = hasTests && hasTestType;
  checks.push({
    name: 'structural_completeness',
    passed: structurallyComplete,
    points: structurallyComplete ? 10 : 0,
    maxPoints: 10,
    details: structurallyComplete
      ? `${llm.tests.length} test(s) with type "${llm.test_type}"`
      : 'Missing test results or test type',
  });

  // Check 7: Multi-signal agreement (5 points)
  // Awarded when 3+ independent verification signals are present
  const signalCount = [!!labMatch, hasHealthCard, hasAccession, nameMatched].filter(Boolean).length;
  const multiSignal = signalCount >= 3;
  checks.push({
    name: 'multi_signal_agreement',
    passed: multiSignal,
    points: multiSignal ? 5 : 0,
    maxPoints: 5,
    details: multiSignal
      ? `${signalCount} of 4 verification signals present`
      : `Only ${signalCount} of 4 verification signals present (need 3+)`,
  });

  const score = checks.reduce((sum, check) => sum + check.points, 0);
  const level = scoreToLevel(score);

  // Hard requirements for verification:
  // 1. If a user profile was provided, name must match (prevents someone else's document)
  // 2. Collection date must not be in the future (impossible to have future results)
  const nameCheckPassed = userProfile ? nameMatched : true;
  const hasFutureDate = !!dateValidation.isFuture;
  const isSuspiciouslyFast = !!dateValidation.isSuspiciouslyFast;
  const isVerified = score >= 60 && nameCheckPassed && !hasFutureDate;

  return { score, level, checks, isVerified, hasFutureDate, isSuspiciouslyFast };
}
