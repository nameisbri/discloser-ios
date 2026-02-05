// Main document parser - orchestrates text extraction and LLM parsing

import { parseDocumentWithLLM } from './llmParser';
import { normalizeTestName } from './testNormalizer';
import { standardizeResult } from './resultStandardizer';
import { extractTextFromPDF, isPDFExtractionAvailable } from './pdfParser';
import { DocumentParsingError, extractTextFromImage } from './ocrExtractor';
import { ParsedDocument, ParsedTest, LLMResponse, UserProfileForVerification } from './types';
import { matchesCanadianLab } from '../utils/labNameNormalizer';
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

    // Step 6: Verify document authenticity (includes name matching if profile provided)
    const verification = verifyDocument(llmResponse, userProfile);

    logger.info('Document parsing complete', {
      ...logContext,
      testType,
      testCount: tests.length,
      isVerified: verification.isVerified,
      collectionDate,
    });

    return {
      collectionDate,
      testType,
      tests,
      notes: llmResponse.notes,
      rawText: extractedText.substring(0, 500),
      isVerified: verification.isVerified,
      verificationDetails: verification.details,
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
 * Normalizes a name for comparison: lowercase, trim, remove extra spaces
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Checks if the extracted patient name matches the user's profile name
 * Uses fuzzy matching - names don't need to be in exact order
 */
function matchNames(extractedName: string | undefined, userProfile?: UserProfileForVerification): boolean {
  if (!extractedName || !userProfile) return false;
  if (!userProfile.first_name && !userProfile.last_name) return false;

  const normalizedExtracted = normalizeName(extractedName);
  const extractedParts = normalizedExtracted.split(' ').filter(p => p.length > 0);

  // Build user name parts
  const userParts: string[] = [];
  if (userProfile.first_name) {
    userParts.push(...normalizeName(userProfile.first_name).split(' '));
  }
  if (userProfile.last_name) {
    userParts.push(...normalizeName(userProfile.last_name).split(' '));
  }

  if (userParts.length === 0) return false;

  // Check if all user name parts appear in the extracted name
  // This handles name order differences (e.g., "Smith John" vs "John Smith")
  const matchedParts = userParts.filter(part =>
    extractedParts.some(extracted =>
      extracted === part || extracted.includes(part) || part.includes(extracted)
    )
  );

  // Require at least 2 parts to match (first + last), or all parts if user only has 1-2
  const requiredMatches = Math.min(2, userParts.length);
  return matchedParts.length >= requiredMatches;
}

/**
 * Verifies document authenticity based on extracted fields
 * Requires: recognized lab + (health card OR accession number) + name match (if profile provided)
 */
function verifyDocument(llm: LLMResponse, userProfile?: UserProfileForVerification) {
  const isRecognizedLab = matchesCanadianLab(llm.lab_name || '');
  const hasHealthCard = llm.health_card_present === true;
  const hasAccession = !!llm.accession_number;
  const nameMatched = matchNames(llm.patient_name, userProfile);

  // Verified if:
  // 1. From recognized lab AND
  // 2. Has at least one identifier (health card OR accession number) AND
  // 3. Name matches user profile (if profile was provided)
  const hasValidIdentifier = hasHealthCard || hasAccession;
  const nameCheckPassed = userProfile ? nameMatched : true; // Skip name check if no profile
  const isVerified = isRecognizedLab && hasValidIdentifier && nameCheckPassed;

  return {
    isVerified,
    details: {
      labName: llm.lab_name,
      patientName: llm.patient_name,
      hasHealthCard,
      hasAccessionNumber: hasAccession,
      nameMatched,
    },
  };
}
