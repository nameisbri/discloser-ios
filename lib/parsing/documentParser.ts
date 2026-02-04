// Main document parser - orchestrates text extraction and LLM parsing

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { parseDocumentWithLLM } from './llmParser';
import { normalizeTestName } from './testNormalizer';
import { standardizeResult } from './resultStandardizer';
import { extractTextFromPDF, isPDFExtractionAvailable } from './pdfParser';
import { ParsedDocument, ParsedTest, LLMResponse, UserProfileForVerification } from './types';
import { matchesCanadianLab } from '../utils/labNameNormalizer';
import { logger } from '../utils/logger';
import { NetworkRequestError, isNetworkRequestError, fetchWithRetry } from '../http';

/**
 * Error types that can occur during document parsing
 */
type ParsingErrorType = 'ocr' | 'llm_parsing' | 'normalization' | 'validation' | 'network' | 'pdf_extraction' | 'unknown';

/**
 * Maximum image dimensions for OCR to keep payload size manageable
 * Target: Keep base64 payload under ~3 MB for reliable mobile network transmission
 */
const MAX_IMAGE_DIMENSION = 2048; // pixels

/**
 * Compresses an image if it's too large for reliable network transmission.
 * Resizes to fit within MAX_IMAGE_DIMENSION while maintaining aspect ratio.
 *
 * @param uri - Image URI to compress
 * @param fileIdentifier - Optional file identifier for logging
 * @returns URI of compressed image (or original if compression not needed)
 */
async function compressImageIfNeeded(uri: string, fileIdentifier?: string): Promise<string> {
  try {
    // Get image info to check size
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || !('size' in fileInfo)) {
      logger.warn('Could not get image file info, using original', { fileIdentifier, uri: uri.substring(0, 50) });
      return uri;
    }

    const fileSizeKB = fileInfo.size / 1024;
    const estimatedBase64MB = (fileInfo.size * 1.33) / (1024 * 1024); // Base64 is ~33% larger

    logger.info('Image file size check', {
      fileIdentifier,
      fileSizeKB: fileSizeKB.toFixed(2),
      estimatedBase64MB: estimatedBase64MB.toFixed(2),
    });

    // If estimated payload will be under 3 MB, no compression needed
    if (estimatedBase64MB < 3) {
      logger.info('Image size acceptable, no compression needed', { fileIdentifier });
      return uri;
    }

    // Compress image
    logger.info('Compressing large image for OCR', {
      fileIdentifier,
      originalSizeKB: fileSizeKB.toFixed(2),
      maxDimension: MAX_IMAGE_DIMENSION,
    });

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: MAX_IMAGE_DIMENSION,
            height: MAX_IMAGE_DIMENSION,
          },
        },
      ],
      {
        compress: 0.8, // 80% quality - good balance for text recognition
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Check new size
    const compressedInfo = await FileSystem.getInfoAsync(result.uri);
    if (compressedInfo.exists && 'size' in compressedInfo) {
      const compressedSizeKB = compressedInfo.size / 1024;
      const reduction = ((fileInfo.size - compressedInfo.size) / fileInfo.size * 100).toFixed(1);

      logger.info('Image compressed successfully', {
        fileIdentifier,
        originalSizeKB: fileSizeKB.toFixed(2),
        compressedSizeKB: compressedSizeKB.toFixed(2),
        reductionPercent: reduction,
      });
    }

    return result.uri;
  } catch (error) {
    // If compression fails, continue with original image
    logger.warn('Image compression failed, using original', {
      fileIdentifier,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return uri;
  }
}

/**
 * Custom error class for document parsing failures.
 * Provides context about which step failed and error classification.
 */
export class DocumentParsingError extends Error {
  public readonly step: ParsingErrorType;
  public readonly originalError?: unknown;
  public readonly fileIdentifier?: string;
  public readonly details: Record<string, unknown>;

  constructor(
    step: ParsingErrorType,
    message: string,
    options: {
      originalError?: unknown;
      fileIdentifier?: string;
      details?: Record<string, unknown>;
    } = {}
  ) {
    super(message);

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, DocumentParsingError.prototype);

    this.name = 'DocumentParsingError';
    this.step = step;
    this.originalError = options.originalError;
    this.fileIdentifier = options.fileIdentifier;
    this.details = options.details || {};

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocumentParsingError.prototype.constructor);
    }
  }

  /**
   * Creates a user-friendly error message based on the error type
   */
  getUserMessage(): string {
    switch (this.step) {
      case 'ocr':
        return 'Failed to extract text from the image. Please ensure the image is clear and readable.';
      case 'llm_parsing':
        return 'Failed to parse the test results. Please ensure the document contains valid test results.';
      case 'normalization':
        return 'Failed to process the test results. Please try again.';
      case 'validation':
        return 'The document does not appear to contain valid test results.';
      case 'network':
        return 'Network error. Please check your connection and try again.';
      case 'pdf_extraction':
        return 'Failed to extract text from the PDF. The file may be corrupted or password-protected.';
      default:
        return 'Failed to process the document. Please try again.';
    }
  }

  /**
   * Serializes the error for logging and debugging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      step: this.step,
      message: this.message,
      userMessage: this.getUserMessage(),
      fileIdentifier: this.fileIdentifier,
      details: this.details,
      originalError: this.originalError instanceof Error ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : this.originalError,
      stack: this.stack,
    };
  }
}

/**
 * Extracts text from an image using Google Cloud Vision OCR
 * @throws {DocumentParsingError} When OCR fails or no text is found
 */
export async function extractTextFromImage(uri: string, fileIdentifier?: string): Promise<string> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      logger.error('Google Vision API key not configured');
      throw new DocumentParsingError(
        'ocr',
        'Google Vision API key not configured',
        { fileIdentifier }
      );
    }

    logger.info('Starting text extraction via OCR', { fileIdentifier, uri: uri.substring(0, 50) });

    // Compress image if needed to ensure reliable network transmission
    const imageUri = await compressImageIfNeeded(uri, fileIdentifier);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Log request size for diagnostics
    const base64SizeKB = (base64.length * 0.75 / 1024).toFixed(2); // Base64 is ~33% larger than binary
    logger.info('OCR request size', {
      fileIdentifier,
      base64Length: base64.length,
      estimatedImageSizeKB: base64SizeKB
    });

    // Call Google Vision OCR API with retry logic
    // Note: Google Vision API can handle much larger payloads than LLM APIs,
    // so we disable size validation here. The API itself has a 20 MB limit.
    const response = await fetchWithRetry(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          }],
        }),
        timeout: 30000,      // 30 seconds timeout
        maxRetries: 3,       // 3 retry attempts
        baseDelay: 1000,     // Exponential backoff: 1s, 2s, 4s
        validateSize: false, // Disable size validation for OCR (Google Vision supports up to 20 MB)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OCR API request failed', {
        fileIdentifier,
        statusCode: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      throw new DocumentParsingError(
        'network',
        `OCR API failed with status ${response.status}: ${response.statusText}`,
        {
          fileIdentifier,
          originalError: errorText,
          details: {
            statusCode: response.status,
            statusText: response.statusText,
          },
        }
      );
    }

    const data = await response.json();
    const text = data.responses?.[0]?.fullTextAnnotation?.text;

    if (!text || text.length < 20) {
      logger.warn('No text extracted from image', {
        fileIdentifier,
        textLength: text?.length || 0,
      });

      throw new DocumentParsingError(
        'ocr',
        'No readable text found in image. Please ensure the image is clear and contains text.',
        {
          fileIdentifier,
          details: { textLength: text?.length || 0 },
        }
      );
    }

    logger.info('Text extraction successful', {
      fileIdentifier,
      textLength: text.length,
    });

    return text;
  } catch (error) {
    // Re-throw DocumentParsingError as-is
    if (error instanceof DocumentParsingError) {
      throw error;
    }

    // Classify and wrap other errors
    let errorType: ParsingErrorType = 'ocr';
    if (isNetworkRequestError(error) || (error instanceof Error && error.message.includes('network'))) {
      errorType = 'network';
    }

    logger.error('Text extraction failed', {
      fileIdentifier,
      error,
      errorType,
    });

    throw new DocumentParsingError(
      errorType,
      `Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        fileIdentifier,
        originalError: error,
      }
    );
  }
}

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
    console.error('Date formatting error:', error);
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
