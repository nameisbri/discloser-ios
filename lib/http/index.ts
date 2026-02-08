/**
 * HTTP Client Module
 *
 * Centralized exports for HTTP client infrastructure.
 *
 * @module lib/http
 */

// Export HTTP client functions
export {
  fetchWithRetry,
  type FetchOptions,
} from './httpClient';

// Export error types and helpers
export {
  NetworkRequestError,
  isNetworkRequestError,
  isNetworkError,
  isRetryableError,
  getErrorMessage,
  classifyStatusCode,
  createErrorFromResponse,
  type NetworkErrorType,
  type ErrorDetails,
} from './errors';
