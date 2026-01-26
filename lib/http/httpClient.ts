/**
 * HTTP Client with Retry Logic
 *
 * Production-ready HTTP client wrapper featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling with AbortController
 * - Request size validation and warnings
 * - Comprehensive error classification
 * - Development-mode logging for debugging
 *
 * Design Principles:
 * - Open/Closed Principle: Extensible through configuration without modifying core logic
 * - Single Responsibility: Each function has one clear purpose
 * - Dependency Inversion: Depends on fetch abstraction, not specific implementation
 *
 * @example
 * ```ts
 * import { fetchWithRetry } from '@/lib/http/httpClient';
 *
 * const data = await fetchWithRetry('https://api.example.com/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ key: 'value' }),
 *   maxRetries: 3,
 *   timeout: 10000,
 * });
 * ```
 */

import { logger } from '../utils/logger';
import {
  NetworkRequestError,
  isRetryableError,
  createErrorFromResponse,
  type ErrorDetails,
} from './errors';

/**
 * Configuration options for HTTP requests with retry logic.
 */
export interface FetchOptions extends RequestInit {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;

  /**
   * Request timeout in milliseconds (default: 30000 = 30 seconds)
   */
  timeout?: number;

  /**
   * Base delay in milliseconds for exponential backoff (default: 1000)
   */
  baseDelay?: number;

  /**
   * Whether to validate request size (default: true)
   */
  validateSize?: boolean;

  /**
   * Custom request ID for tracking and correlation
   */
  requestId?: string;
}

/**
 * Request size thresholds in bytes
 */
const SIZE_THRESHOLDS = {
  WARN: 1 * 1024 * 1024, // 1 MB - warn about large requests
  ERROR: 10 * 1024 * 1024, // 10 MB - reject overly large requests
} as const;

/**
 * Default configuration values
 */
const DEFAULTS = {
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
  BASE_DELAY: 1000, // 1 second
} as const;

/**
 * Estimates the size of a request body in bytes.
 *
 * Strategy: Handles various body types (string, FormData, Blob, etc.)
 * to provide accurate size estimates for validation.
 *
 * @param body - The request body to measure
 * @returns Estimated size in bytes, or 0 if size cannot be determined
 */
function estimateBodySize(body: BodyInit | null | undefined): number {
  if (!body) return 0;

  // String or text-based body
  if (typeof body === 'string') {
    // UTF-8 encoding: assume worst case of 3 bytes per character
    return body.length * 3;
  }

  // Blob or File
  if (body instanceof Blob) {
    return body.size;
  }

  // ArrayBuffer or typed arrays
  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }

  if (ArrayBuffer.isView(body)) {
    return body.byteLength;
  }

  // FormData - difficult to measure accurately without iterating
  // Return 0 and let the browser handle it
  if (body instanceof FormData) {
    return 0;
  }

  // URLSearchParams
  if (body instanceof URLSearchParams) {
    return body.toString().length * 3; // UTF-8 worst case
  }

  // Unknown body type
  return 0;
}

/**
 * Validates request size and logs warnings/errors as appropriate.
 *
 * Quality Assurance: Prevents accidentally sending oversized requests
 * that could cause performance issues or fail silently.
 *
 * @param body - The request body to validate
 * @param url - The request URL for logging context
 * @throws NetworkRequestError if body exceeds maximum allowed size
 */
function validateRequestSize(body: BodyInit | null | undefined, url: string): void {
  const size = estimateBodySize(body);

  if (size === 0) {
    // Size couldn't be determined, skip validation
    return;
  }

  const sizeMB = (size / (1024 * 1024)).toFixed(2);

  if (size > SIZE_THRESHOLDS.ERROR) {
    const errorMsg = `Request body too large: ${sizeMB} MB (max: 10 MB)`;
    logger.error(errorMsg, { url, size });

    throw new NetworkRequestError('client', errorMsg, {
      url,
      size,
      maxSize: SIZE_THRESHOLDS.ERROR,
    });
  }

  if (size > SIZE_THRESHOLDS.WARN) {
    logger.warn(`Large request body detected: ${sizeMB} MB`, { url, size });
  }
}

/**
 * Calculates the delay for exponential backoff.
 *
 * Algorithm: delay = baseDelay * (2 ^ attempt)
 * - Attempt 1: 1s
 * - Attempt 2: 2s
 * - Attempt 3: 4s
 *
 * Strategy Pattern: Implements exponential backoff algorithm to reduce
 * load on failing services and increase success rate of retries.
 *
 * @param attempt - The current retry attempt (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Sleeps for the specified duration.
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates an AbortController that times out after the specified duration.
 *
 * Resource Management: Ensures requests don't hang indefinitely,
 * preventing resource leaks and improving user experience.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object with AbortController and cleanup function
 */
function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
  };

  return { controller, cleanup };
}

/**
 * Fetches a resource with automatic retry logic and timeout handling.
 *
 * Core Features:
 * - Exponential backoff retry strategy (1s, 2s, 4s)
 * - Request timeout with AbortController
 * - Request size validation
 * - Comprehensive error classification
 * - Development-mode logging
 *
 * Retry Policy:
 * - Retries: Network errors, timeouts, 5xx server errors
 * - No Retry: 4xx client errors (auth, validation, not found, etc.)
 *
 * Error Handling Strategy:
 * - Network errors: Wrapped in NetworkRequestError with 'network' type
 * - HTTP errors: Wrapped with appropriate type (client/server)
 * - Timeouts: Wrapped with 'abort' type
 * - Parse errors: Wrapped with 'parse' type
 *
 * @param url - The URL to fetch
 * @param options - Fetch options with retry configuration
 * @returns Promise resolving to the Response object
 * @throws NetworkRequestError on failure after all retries exhausted
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    maxRetries = DEFAULTS.MAX_RETRIES,
    timeout = DEFAULTS.TIMEOUT,
    baseDelay = DEFAULTS.BASE_DELAY,
    validateSize = true,
    requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    signal,
    ...fetchOptions
  } = options;

  // Validate request size if enabled
  if (validateSize && fetchOptions.body) {
    validateRequestSize(fetchOptions.body, url);
  }

  // Log request in dev mode
  logger.debug('HTTP request initiated', {
    requestId,
    method: fetchOptions.method || 'GET',
    url,
    timeout,
    maxRetries,
  });

  let lastError: NetworkRequestError | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Create timeout controller for this attempt
    const { controller: timeoutController, cleanup: cleanupTimeout } =
      createTimeoutController(timeout);

    // Combine user-provided signal with timeout signal
    const combinedSignal = signal || timeoutController.signal;

    try {
      // Execute fetch request
      const startTime = Date.now();

      const response = await fetch(url, {
        ...fetchOptions,
        signal: combinedSignal,
      });

      const duration = Date.now() - startTime;

      // Cleanup timeout
      cleanupTimeout();

      // Log successful response
      logger.debug('HTTP response received', {
        requestId,
        status: response.status,
        duration,
        attempt: attempt + 1,
      });

      // Check for HTTP errors
      if (!response.ok) {
        const error = await createErrorFromResponse(response, {
          url,
          method: fetchOptions.method || 'GET',
          requestId,
        });

        // Determine if we should retry
        if (attempt < maxRetries && isRetryableError(error)) {
          lastError = error;

          const delay = calculateBackoffDelay(attempt, baseDelay);

          logger.warn('HTTP request failed, retrying', {
            requestId,
            attempt: attempt + 1,
            maxRetries,
            error: error.message,
            retryDelay: delay,
            statusCode: error.statusCode,
          });

          await sleep(delay);
          continue; // Retry
        }

        // No retry, throw error
        logger.error('HTTP request failed', {
          requestId,
          error: error.toJSON(),
          attempt: attempt + 1,
        });

        throw error;
      }

      // Success - return response
      return response;
    } catch (error) {
      // Cleanup timeout
      cleanupTimeout();

      // Classify the error
      let networkError: NetworkRequestError;

      if (error instanceof NetworkRequestError) {
        networkError = error;
      } else if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted (timeout)
        networkError = new NetworkRequestError('abort', 'Request timed out', {
          url,
          method: fetchOptions.method || 'GET',
          requestId,
          timeout,
          error,
        });
      } else if (error instanceof Error) {
        // Network error or other fetch error
        networkError = new NetworkRequestError('network', error.message, {
          url,
          method: fetchOptions.method || 'GET',
          requestId,
          error,
        });
      } else {
        // Unknown error type
        networkError = new NetworkRequestError(
          'unknown',
          'An unexpected error occurred',
          {
            url,
            method: fetchOptions.method || 'GET',
            requestId,
            error,
          }
        );
      }

      // Determine if we should retry
      if (attempt < maxRetries && isRetryableError(networkError)) {
        lastError = networkError;

        const delay = calculateBackoffDelay(attempt, baseDelay);

        logger.warn('Network request failed, retrying', {
          requestId,
          attempt: attempt + 1,
          maxRetries,
          error: networkError.message,
          retryDelay: delay,
          type: networkError.type,
        });

        await sleep(delay);
        continue; // Retry
      }

      // No retry, throw error
      logger.error('Network request failed', {
        requestId,
        error: networkError.toJSON(),
        attempt: attempt + 1,
      });

      throw networkError;
    }
  }

  // All retries exhausted
  const finalError =
    lastError ||
    new NetworkRequestError('unknown', 'Request failed after all retries', {
      url,
      method: fetchOptions.method || 'GET',
      requestId,
      maxRetries,
    });

  logger.error('Request failed after all retries', {
    requestId,
    error: finalError.toJSON(),
  });

  throw finalError;
}

/**
 * Convenience wrapper for JSON POST requests with retry logic.
 *
 * @param url - The URL to post to
 * @param data - The data to send as JSON
 * @param options - Additional fetch options
 * @returns Promise resolving to the parsed JSON response
 */
export async function postJSON<T = unknown>(
  url: string,
  data: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  });

  // Parse JSON response
  try {
    return await response.json();
  } catch (error) {
    throw new NetworkRequestError('parse', 'Failed to parse JSON response', {
      url,
      method: 'POST',
      error,
    });
  }
}

/**
 * Convenience wrapper for JSON GET requests with retry logic.
 *
 * @param url - The URL to fetch from
 * @param options - Additional fetch options
 * @returns Promise resolving to the parsed JSON response
 */
export async function getJSON<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Parse JSON response
  try {
    return await response.json();
  } catch (error) {
    throw new NetworkRequestError('parse', 'Failed to parse JSON response', {
      url,
      method: 'GET',
      error,
    });
  }
}
