// PDF text extraction module using native APIs
// Uses expo-pdf-text-extract (iOS PDFKit / Android PDFBox)

import {
  extractText,
  extractTextFromPage,
  getPageCount,
  extractTextWithInfo,
  isAvailable,
} from 'expo-pdf-text-extract';
import { logger } from '../utils/logger';

/**
 * Result of PDF text extraction
 */
export interface PDFExtractionResult {
  /** Combined text from all pages */
  text: string;
  /** Number of pages in the PDF */
  pageCount: number;
  /** Number of pages actually processed */
  pagesProcessed: number;
  /** Method used for extraction */
  extractionMethod: 'native' | 'ocr';
  /** Text extracted from each page (for debugging/display) */
  pageTexts: string[];
  /** Whether extraction was successful */
  success: boolean;
  /** Error message if extraction failed */
  error?: string;
}

/**
 * Configuration for PDF extraction
 */
export interface PDFExtractionOptions {
  /** Maximum pages to process (default: 10) */
  maxPages?: number;
  /** Minimum text length to consider extraction successful (default: 50) */
  minTextThreshold?: number;
  /** Optional identifier for logging */
  fileIdentifier?: string;
}

/**
 * Default configuration values
 */
const DEFAULT_OPTIONS: Required<Omit<PDFExtractionOptions, 'fileIdentifier'>> = {
  maxPages: 10,
  minTextThreshold: 50,
};

/**
 * Checks if the native PDF extractor is available.
 * Returns false in Expo Go or if native module failed to load.
 */
export function isPDFExtractionAvailable(): boolean {
  return isAvailable();
}

/**
 * Extracts text from a PDF file using native APIs.
 *
 * @param uri - Path to the PDF file (file://, content://, or absolute path)
 * @param options - Extraction options
 * @returns PDFExtractionResult with extracted text and metadata
 */
export async function extractTextFromPDF(
  uri: string,
  options: PDFExtractionOptions = {}
): Promise<PDFExtractionResult> {
  const { maxPages, minTextThreshold, fileIdentifier } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const logContext = { fileIdentifier, uri: uri.substring(0, 50) };

  // Check if native module is available
  if (!isAvailable()) {
    logger.error('PDF extraction: Native module not available', logContext);
    return {
      text: '',
      pageCount: 0,
      pagesProcessed: 0,
      extractionMethod: 'native',
      pageTexts: [],
      success: false,
      error: 'PDF extraction is not available. Please use a development build.',
    };
  }

  try {
    logger.info('Starting PDF text extraction', logContext);

    // Get page count first
    const totalPageCount = await getPageCount(uri);
    const pagesToProcess = Math.min(totalPageCount, maxPages);

    logger.info('PDF info retrieved', {
      ...logContext,
      totalPageCount,
      pagesToProcess,
    });

    // Try full document extraction first (more efficient)
    const fullResult = await extractTextWithInfo(uri);

    if (fullResult.success && fullResult.text.length >= minTextThreshold) {
      logger.info('PDF text extraction successful (full document)', {
        ...logContext,
        textLength: fullResult.text.length,
        pageCount: fullResult.pageCount,
      });

      return {
        text: fullResult.text,
        pageCount: totalPageCount,
        pagesProcessed: totalPageCount,
        extractionMethod: 'native',
        pageTexts: [fullResult.text], // Single combined text
        success: true,
      };
    }

    // If full extraction didn't yield enough text, try page-by-page
    // This can help with some PDFs that have text spread across pages
    logger.info('Full extraction yielded minimal text, trying page-by-page', {
      ...logContext,
      fullTextLength: fullResult.text?.length || 0,
    });

    const pageTexts: string[] = [];
    let combinedText = '';

    for (let page = 1; page <= pagesToProcess; page++) {
      try {
        const pageText = await extractTextFromPage(uri, page);
        pageTexts.push(pageText);
        combinedText += pageText + '\n\n--- Page ' + page + ' ---\n\n';

        logger.info('Page extracted', {
          ...logContext,
          page,
          pageTextLength: pageText.length,
        });
      } catch (pageError) {
        logger.warn('Failed to extract page', {
          ...logContext,
          page,
          error: pageError instanceof Error ? pageError.message : 'Unknown error',
        });
        pageTexts.push(''); // Empty string for failed page
      }
    }

    const totalTextLength = combinedText.length;

    if (totalTextLength >= minTextThreshold) {
      logger.info('PDF text extraction successful (page-by-page)', {
        ...logContext,
        textLength: totalTextLength,
        pagesProcessed: pagesToProcess,
      });

      return {
        text: combinedText.trim(),
        pageCount: totalPageCount,
        pagesProcessed: pagesToProcess,
        extractionMethod: 'native',
        pageTexts,
        success: true,
      };
    }

    // Text extraction didn't yield enough content - likely a scanned PDF
    logger.warn('PDF appears to be scanned (minimal extractable text)', {
      ...logContext,
      totalTextLength,
      threshold: minTextThreshold,
    });

    return {
      text: combinedText.trim(),
      pageCount: totalPageCount,
      pagesProcessed: pagesToProcess,
      extractionMethod: 'native',
      pageTexts,
      success: false,
      error: 'This PDF appears to be a scanned document. Please take a photo of your results instead, or use a text-based PDF from your lab portal.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('PDF text extraction failed', {
      ...logContext,
      error: errorMessage,
    });

    // Classify the error with user-friendly messages
    let userError = 'Failed to extract text from PDF. Please try again or use a different file.';
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('password') || lowerError.includes('encrypted')) {
      userError = 'This PDF is password-protected. Please remove the password and try again.';
    } else if (lowerError.includes('corrupt') || lowerError.includes('invalid') || lowerError.includes('malformed')) {
      userError = 'Unable to read this PDF. The file may be corrupted or damaged.';
    } else if (lowerError.includes('not found') || lowerError.includes('no such file') || lowerError.includes('does not exist')) {
      userError = 'PDF file not found. Please try selecting the file again.';
    } else if (lowerError.includes('permission') || lowerError.includes('access denied')) {
      userError = 'Cannot access this PDF. Please check file permissions and try again.';
    } else if (lowerError.includes('empty') || lowerError.includes('no pages')) {
      userError = 'This PDF appears to be empty. Please select a different file.';
    } else if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
      userError = 'PDF processing timed out. The file may be too complex. Please try a simpler file.';
    }

    return {
      text: '',
      pageCount: 0,
      pagesProcessed: 0,
      extractionMethod: 'native',
      pageTexts: [],
      success: false,
      error: userError,
    };
  }
}

/**
 * Gets the page count of a PDF file.
 *
 * @param uri - Path to the PDF file
 * @returns Number of pages, or 0 if unable to read
 */
export async function getPDFPageCount(uri: string): Promise<number> {
  if (!isAvailable()) {
    return 0;
  }

  try {
    return await getPageCount(uri);
  } catch (error) {
    logger.warn('Failed to get PDF page count', {
      uri: uri.substring(0, 50),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * Validates a PDF file for processing.
 * Checks file size and page count limits.
 *
 * @param uri - Path to the PDF file
 * @param fileSize - File size in bytes (from document picker)
 * @returns Validation result with error message if invalid
 */
export async function validatePDF(
  uri: string,
  fileSize?: number
): Promise<{ valid: boolean; error?: string; pageCount?: number }> {
  const MAX_FILE_SIZE_MB = 20;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const MAX_PAGES = 10;

  // Check file size
  if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `This PDF is too large (${(fileSize / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_FILE_SIZE_MB} MB.`,
    };
  }

  // Check page count
  const pageCount = await getPDFPageCount(uri);

  if (pageCount === 0) {
    return {
      valid: false,
      error: 'Unable to read this PDF. The file may be corrupted or password-protected.',
    };
  }

  if (pageCount > MAX_PAGES) {
    // We'll still process it, but warn the user
    return {
      valid: true,
      pageCount,
      error: `This PDF has ${pageCount} pages. Only the first ${MAX_PAGES} pages will be processed.`,
    };
  }

  return {
    valid: true,
    pageCount,
  };
}
