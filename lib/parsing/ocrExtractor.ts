// OCR text extraction module using Supabase Edge Function
// Separated from documentParser to avoid circular dependencies
// API keys are kept server-side for security

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from '../utils/logger';
import { fetchWithRetry, isNetworkRequestError } from '../http';
import { getAccessToken } from '../supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

/**
 * Error types that can occur during document parsing
 */
export type ParsingErrorType = 'ocr' | 'llm_parsing' | 'normalization' | 'validation' | 'network' | 'pdf_extraction' | 'unknown';

/**
 * Maximum image dimensions for OCR to keep payload size manageable
 * Target: Keep base64 payload under ~3 MB for reliable mobile network transmission
 */
const MAX_IMAGE_DIMENSION = 2048; // pixels

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
 * Extracts text from an image using OCR via the extract-text-ocr Edge Function.
 * The Edge Function handles:
 * - Google Vision API calls (with server-side API key)
 * - Image size validation
 * - Response parsing
 * @throws {DocumentParsingError} When OCR fails or no text is found
 */
export async function extractTextFromImage(uri: string, fileIdentifier?: string): Promise<string> {
  try {
    logger.info('Starting text extraction via OCR', { fileIdentifier, uri: uri.substring(0, 50) });

    // Compress image if needed to ensure reliable network transmission
    const imageUri = await compressImageIfNeeded(uri, fileIdentifier);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Log request size for diagnostics
    const base64SizeKB = (base64.length * 0.75 / 1024).toFixed(2);
    logger.info('OCR request size', {
      fileIdentifier,
      base64Length: base64.length,
      estimatedImageSizeKB: base64SizeKB
    });

    // Get a fresh access token (auto-refreshes if expired)
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
    } catch {
      throw new DocumentParsingError(
        'ocr',
        'Not authenticated. Please sign in to process documents.',
        { fileIdentifier }
      );
    }

    // Call the Edge Function with timeout and retry
    const response = await fetchWithRetry(`${SUPABASE_URL}/functions/v1/extract-text-ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({ imageBase64: base64 }),
      timeout: 60000, // 60s — OCR + Google Vision can be slow on large images
      maxRetries: 2,
      validateSize: false, // We handle our own compression above
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      logger.error('OCR Edge Function request failed', {
        fileIdentifier,
        statusCode: response.status,
        error: errorData.error,
      });

      // Handle specific error cases
      if (response.status === 401) {
        throw new DocumentParsingError(
          'ocr',
          'Authentication failed. Please sign in again.',
          { fileIdentifier, details: { statusCode: response.status } }
        );
      }

      if (response.status === 422) {
        throw new DocumentParsingError(
          'ocr',
          'No readable text found in image. Please ensure the image is clear and contains text.',
          { fileIdentifier, details: { textLength: errorData.textLength || 0 } }
        );
      }

      throw new DocumentParsingError(
        'network',
        errorData.error || `OCR failed with status ${response.status}`,
        {
          fileIdentifier,
          originalError: errorData.error,
          details: { statusCode: response.status },
        }
      );
    }

    const data = await response.json();
    const text = data.text;

    logger.info('Text extraction successful', {
      fileIdentifier,
      textLength: data.textLength || text.length,
    });

    return text;
  } catch (error) {
    // Re-throw DocumentParsingError as-is
    if (error instanceof DocumentParsingError) {
      throw error;
    }

    // Classify and wrap other errors
    let errorType: ParsingErrorType = 'ocr';
    if (isNetworkRequestError(error) || (error instanceof Error && (error.message.includes('network') || error.message.includes('timed out')))) {
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
