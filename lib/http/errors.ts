/**
 * HTTP Error Types and Helpers
 *
 * Provides comprehensive error classification for network operations:
 * - NetworkRequestError: Custom error class with detailed context
 * - Error type discrimination (network vs. server vs. client errors)
 * - Retry eligibility determination
 * - User-friendly error message generation
 *
 * @example
 * ```ts
 * import { NetworkRequestError, isRetryableError } from '@/lib/http/errors';
 *
 * try {
 *   await fetch(url);
 * } catch (error) {
 *   const networkError = new NetworkRequestError(
 *     'network',
 *     'Failed to connect',
 *     { url, error }
 *   );
 *
 *   if (isRetryableError(networkError)) {
 *     // Retry logic
 *   }
 * }
 * ```
 */

/**
 * Types of network errors that can occur.
 *
 * - network: Connection failures, timeouts, DNS errors
 * - server: 5xx status codes (server-side errors)
 * - client: 4xx status codes (client-side errors - NOT retryable)
 * - parse: Response parsing failures
 * - abort: Request was aborted (e.g., by timeout)
 * - unknown: Unclassified errors
 */
export type NetworkErrorType =
  | 'network'
  | 'server'
  | 'client'
  | 'parse'
  | 'abort'
  | 'unknown';

/**
 * Additional context for error analysis and debugging.
 */
export interface ErrorDetails {
  url?: string;
  method?: string;
  statusCode?: number;
  statusText?: string;
  requestId?: string;
  timestamp?: string;
  error?: unknown;
  [key: string]: unknown; // Allow additional custom properties
}

/**
 * Custom error class for network-related failures.
 *
 * Design Principles:
 * - Extends native Error for standard error handling compatibility
 * - Provides structured error information for logging and debugging
 * - Maintains error stack traces for troubleshooting
 * - Serializable for remote error reporting
 */
export class NetworkRequestError extends Error {
  /**
   * The classified error type
   */
  public readonly type: NetworkErrorType;

  /**
   * HTTP status code if available
   */
  public readonly statusCode?: number;

  /**
   * Additional error context for debugging
   */
  public readonly details: ErrorDetails;

  /**
   * Creates a new NetworkRequestError.
   *
   * @param type - The error type for classification
   * @param message - Human-readable error description
   * @param details - Additional context about the error
   */
  constructor(type: NetworkErrorType, message: string, details: ErrorDetails = {}) {
    super(message);

    // Set the prototype explicitly for proper instanceof checks
    // (required when extending built-in classes in TypeScript)
    Object.setPrototypeOf(this, NetworkRequestError.prototype);

    this.name = 'NetworkRequestError';
    this.type = type;
    this.statusCode = details.statusCode;
    this.details = {
      ...details,
      timestamp: details.timestamp || new Date().toISOString(),
    };

    // Maintain proper stack trace (when available)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkRequestError.prototype.constructor);
    }
  }

  /**
   * Converts the error to a plain object for serialization.
   * Useful for logging and error reporting.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Type guard to check if an error is a NetworkRequestError.
 *
 * @param error - The error to check
 * @returns True if the error is a NetworkRequestError
 */
export function isNetworkRequestError(error: unknown): error is NetworkRequestError {
  return error instanceof NetworkRequestError;
}

/**
 * Determines if an error is network-related (not application logic).
 *
 * Strategy: Network errors include connection failures, timeouts,
 * DNS errors, and aborted requests. These are typically infrastructure
 * issues rather than application bugs.
 *
 * @param error - The error to check
 * @returns True if the error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (isNetworkRequestError(error)) {
    return error.type === 'network' || error.type === 'abort';
  }

  // Check for common network error patterns in standard errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('dns') ||
      message.includes('enotfound') ||
      message.includes('econnrefused')
    );
  }

  return false;
}

/**
 * Determines if an error should trigger a retry attempt.
 *
 * Retry Logic:
 * - Retry: Network errors, timeouts, 5xx server errors, 429 rate limit
 * - Don't Retry: Most 4xx client errors (bad request, auth, not found, etc.)
 * - Don't Retry: Parse errors (indicates response format issue)
 *
 * Special Case: 429 Too Many Requests
 * - This indicates rate limiting, not a bad request
 * - Should be retried with exponential backoff
 *
 * This follows the Idempotency Principle: only retry operations that
 * are safe to repeat without side effects or where the operation
 * naturally supports retries.
 *
 * @param error - The error to check
 * @returns True if a retry should be attempted
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkRequestError(error)) {
    // Retry network and server errors
    if (error.type === 'network' || error.type === 'server') {
      return true;
    }

    // Retry aborted requests (timeout)
    if (error.type === 'abort') {
      return true;
    }

    // Special case: 429 Too Many Requests is retryable (rate limiting)
    if (error.statusCode === 429) {
      return true;
    }

    // Don't retry other client errors (4xx) - these indicate a problem with the request itself
    if (error.type === 'client') {
      return false;
    }

    // Don't retry parse errors - the response format is wrong
    if (error.type === 'parse') {
      return false;
    }

    // For unknown errors, check status code
    if (error.statusCode) {
      // 5xx server errors are retryable
      if (error.statusCode >= 500 && error.statusCode < 600) {
        return true;
      }
      // 429 is also retryable
      if (error.statusCode === 429) {
        return true;
      }
    }
  }

  // For non-NetworkRequestError instances, check if it's a network error
  return isNetworkError(error);
}

/**
 * Extracts a user-friendly error message from any error type.
 *
 * Strategy: Provides context-appropriate messages that are helpful
 * for end users without exposing technical details or security information.
 *
 * @param error - The error to extract a message from
 * @param fallback - Default message if no specific message can be extracted
 * @returns A user-friendly error message
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  // Handle NetworkRequestError
  if (isNetworkRequestError(error)) {
    // Provide user-friendly messages based on error type
    switch (error.type) {
      case 'network':
        return 'Unable to connect. Please check your internet connection.';
      case 'server':
        return 'Server error. Please try again later.';
      case 'client':
        if (error.statusCode === 401) {
          return 'Authentication required. Please sign in.';
        }
        if (error.statusCode === 403) {
          return 'Access denied. You don\'t have permission to perform this action.';
        }
        if (error.statusCode === 404) {
          return 'Resource not found.';
        }
        if (error.statusCode === 429) {
          return 'Too many requests. Please wait a moment and try again.';
        }
        return 'Invalid request. Please check your input and try again.';
      case 'parse':
        return 'Unable to process server response. Please try again.';
      case 'abort':
        return 'Request timed out. Please try again.';
      default:
        return error.message || fallback;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error || fallback;
  }

  // Fallback for unknown error types
  return fallback;
}

/**
 * Classifies an HTTP status code into an error type.
 *
 * HTTP Status Code Classification:
 * - 4xx: Client errors (bad request, auth issues, not found, etc.)
 * - 5xx: Server errors (internal errors, service unavailable, etc.)
 *
 * @param statusCode - The HTTP status code to classify
 * @returns The error type
 */
export function classifyStatusCode(statusCode: number): NetworkErrorType {
  if (statusCode >= 400 && statusCode < 500) {
    return 'client';
  }
  if (statusCode >= 500 && statusCode < 600) {
    return 'server';
  }
  return 'unknown';
}

/**
 * Creates a NetworkRequestError from a fetch Response object.
 *
 * Factory Pattern: Centralizes error creation logic and ensures
 * consistent error structure across the application.
 *
 * @param response - The fetch Response object
 * @param context - Additional context about the request
 * @returns A NetworkRequestError with appropriate classification
 */
export async function createErrorFromResponse(
  response: Response,
  context: Partial<ErrorDetails> = {}
): Promise<NetworkRequestError> {
  const statusCode = response.status;
  const statusText = response.statusText;
  const type = classifyStatusCode(statusCode);

  // Try to extract error message from response body
  let errorMessage = `HTTP ${statusCode}: ${statusText}`;
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } else {
      const textBody = await response.text();
      if (textBody && textBody.length < 200) {
        errorMessage = textBody;
      }
    }
  } catch {
    // If we can't read the body, use the default message
  }

  return new NetworkRequestError(type, errorMessage, {
    ...context,
    statusCode,
    statusText,
    url: response.url,
  });
}
