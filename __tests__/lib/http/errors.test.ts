/**
 * HTTP Errors Tests
 *
 * Comprehensive tests for error classification and handling:
 * - NetworkRequestError class functionality
 * - Error type discrimination
 * - Retry eligibility determination
 * - User-friendly message generation
 * - Status code classification
 */

import {
  NetworkRequestError,
  isNetworkRequestError,
  isNetworkError,
  isRetryableError,
  getErrorMessage,
  classifyStatusCode,
  createErrorFromResponse,
} from '../../../lib/http/errors';

describe('HTTP Errors', () => {
  describe('NetworkRequestError', () => {
    it('should create error with basic properties', () => {
      const error = new NetworkRequestError('network', 'Connection failed');

      expect(error.name).toBe('NetworkRequestError');
      expect(error.type).toBe('network');
      expect(error.message).toBe('Connection failed');
      expect(error.details).toBeDefined();
      expect(error.details.timestamp).toBeDefined();
    });

    it('should include status code when provided', () => {
      const error = new NetworkRequestError('server', 'Server error', {
        statusCode: 500,
      });

      expect(error.statusCode).toBe(500);
      expect(error.details.statusCode).toBe(500);
    });

    it('should preserve additional details', () => {
      const error = new NetworkRequestError('client', 'Bad request', {
        url: 'https://api.example.com/test',
        method: 'POST',
        requestId: 'req-123',
      });

      expect(error.details.url).toBe('https://api.example.com/test');
      expect(error.details.method).toBe('POST');
      expect(error.details.requestId).toBe('req-123');
    });

    it('should be instance of Error', () => {
      const error = new NetworkRequestError('network', 'Test error');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof NetworkRequestError).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new NetworkRequestError('network', 'Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NetworkRequestError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new NetworkRequestError('server', 'Server error', {
        statusCode: 500,
        url: 'https://api.example.com/test',
      });

      const json = error.toJSON();

      expect(json.name).toBe('NetworkRequestError');
      expect(json.type).toBe('server');
      expect(json.message).toBe('Server error');
      expect(json.statusCode).toBe(500);
      expect(json.details).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it('should preserve original timestamp if provided', () => {
      const customTimestamp = '2026-01-01T00:00:00.000Z';
      const error = new NetworkRequestError('network', 'Test', {
        timestamp: customTimestamp,
      });

      expect(error.details.timestamp).toBe(customTimestamp);
    });

    it('should generate timestamp if not provided', () => {
      const error = new NetworkRequestError('network', 'Test');

      expect(error.details.timestamp).toBeDefined();
      expect(typeof error.details.timestamp).toBe('string');
      // Verify it's a valid ISO timestamp
      expect(new Date(error.details.timestamp as string).getTime()).toBeGreaterThan(0);
    });
  });

  describe('isNetworkRequestError', () => {
    it('should return true for NetworkRequestError instances', () => {
      const error = new NetworkRequestError('network', 'Test');

      expect(isNetworkRequestError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Test');

      expect(isNetworkRequestError(error)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(isNetworkRequestError({})).toBe(false);
      expect(isNetworkRequestError(null)).toBe(false);
      expect(isNetworkRequestError(undefined)).toBe(false);
      expect(isNetworkRequestError('error string')).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network type NetworkRequestError', () => {
      const error = new NetworkRequestError('network', 'Connection failed');

      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for abort type NetworkRequestError', () => {
      const error = new NetworkRequestError('abort', 'Request aborted');

      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for server type NetworkRequestError', () => {
      const error = new NetworkRequestError('server', 'Server error', {
        statusCode: 500,
      });

      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for client type NetworkRequestError', () => {
      const error = new NetworkRequestError('client', 'Bad request', {
        statusCode: 400,
      });

      expect(isNetworkError(error)).toBe(false);
    });

    it('should detect network errors from Error message patterns', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('fetch failed'))).toBe(true);
      expect(isNetworkError(new Error('Connection refused'))).toBe(true);
      expect(isNetworkError(new Error('Request timeout'))).toBe(true);
      expect(isNetworkError(new Error('DNS lookup failed'))).toBe(true);
      expect(isNetworkError(new Error('ENOTFOUND'))).toBe(true);
      expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError(new Error('Invalid JSON'))).toBe(false);
      expect(isNetworkError(new Error('Validation failed'))).toBe(false);
      expect(isNetworkError({})).toBe(false);
      expect(isNetworkError(null)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new NetworkRequestError('network', 'Connection failed');

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (5xx)', () => {
      const error = new NetworkRequestError('server', 'Internal server error', {
        statusCode: 500,
      });

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for abort errors (timeout)', () => {
      const error = new NetworkRequestError('abort', 'Request timed out');

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for client errors (4xx)', () => {
      const error = new NetworkRequestError('client', 'Bad request', {
        statusCode: 400,
      });

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for parse errors', () => {
      const error = new NetworkRequestError('parse', 'Invalid JSON');

      expect(isRetryableError(error)).toBe(false);
    });

    it('should handle 5xx status codes for unknown error types', () => {
      const error = new NetworkRequestError('unknown', 'Error', {
        statusCode: 503,
      });

      expect(isRetryableError(error)).toBe(true);
    });

    it('should handle 4xx status codes for unknown error types', () => {
      const error = new NetworkRequestError('unknown', 'Error', {
        statusCode: 404,
      });

      expect(isRetryableError(error)).toBe(false);
    });

    it('should detect retryable standard network errors', () => {
      expect(isRetryableError(new Error('Network request failed'))).toBe(true);
      expect(isRetryableError(new Error('fetch failed'))).toBe(true);
    });

    it('should return false for non-retryable standard errors', () => {
      expect(isRetryableError(new Error('Invalid input'))).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly message for network errors', () => {
      const error = new NetworkRequestError('network', 'Connection failed');

      expect(getErrorMessage(error)).toBe(
        'Unable to connect. Please check your internet connection.'
      );
    });

    it('should return user-friendly message for server errors', () => {
      const error = new NetworkRequestError('server', 'Internal error', {
        statusCode: 500,
      });

      expect(getErrorMessage(error)).toBe('Server error. Please try again later.');
    });

    it('should return user-friendly message for 401 errors', () => {
      const error = new NetworkRequestError('client', 'Unauthorized', {
        statusCode: 401,
      });

      expect(getErrorMessage(error)).toBe('Authentication required. Please sign in.');
    });

    it('should return user-friendly message for 403 errors', () => {
      const error = new NetworkRequestError('client', 'Forbidden', {
        statusCode: 403,
      });

      expect(getErrorMessage(error)).toBe(
        "Access denied. You don't have permission to perform this action."
      );
    });

    it('should return user-friendly message for 404 errors', () => {
      const error = new NetworkRequestError('client', 'Not found', {
        statusCode: 404,
      });

      expect(getErrorMessage(error)).toBe('Resource not found.');
    });

    it('should return user-friendly message for 429 errors', () => {
      const error = new NetworkRequestError('client', 'Too many requests', {
        statusCode: 429,
      });

      expect(getErrorMessage(error)).toBe(
        'Too many requests. Please wait a moment and try again.'
      );
    });

    it('should return user-friendly message for other client errors', () => {
      const error = new NetworkRequestError('client', 'Bad request', {
        statusCode: 400,
      });

      expect(getErrorMessage(error)).toBe(
        'Invalid request. Please check your input and try again.'
      );
    });

    it('should return user-friendly message for parse errors', () => {
      const error = new NetworkRequestError('parse', 'Invalid JSON');

      expect(getErrorMessage(error)).toBe(
        'Unable to process server response. Please try again.'
      );
    });

    it('should return user-friendly message for abort errors', () => {
      const error = new NetworkRequestError('abort', 'Request aborted');

      expect(getErrorMessage(error)).toBe('Request timed out. Please try again.');
    });

    it('should return error message for unknown NetworkRequestError', () => {
      const error = new NetworkRequestError('unknown', 'Custom error message');

      expect(getErrorMessage(error)).toBe('Custom error message');
    });

    it('should handle standard Error objects', () => {
      const error = new Error('Standard error message');

      expect(getErrorMessage(error)).toBe('Standard error message');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should use fallback for unknown error types', () => {
      expect(getErrorMessage({})).toBe('An unexpected error occurred');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });

    it('should use custom fallback when provided', () => {
      expect(getErrorMessage({}, 'Custom fallback')).toBe('Custom fallback');
    });

    it('should handle Error with empty message', () => {
      const error = new Error('');

      expect(getErrorMessage(error)).toBe('An unexpected error occurred');
    });
  });

  describe('classifyStatusCode', () => {
    it('should classify 4xx as client errors', () => {
      expect(classifyStatusCode(400)).toBe('client');
      expect(classifyStatusCode(401)).toBe('client');
      expect(classifyStatusCode(403)).toBe('client');
      expect(classifyStatusCode(404)).toBe('client');
      expect(classifyStatusCode(429)).toBe('client');
      expect(classifyStatusCode(499)).toBe('client');
    });

    it('should classify 5xx as server errors', () => {
      expect(classifyStatusCode(500)).toBe('server');
      expect(classifyStatusCode(502)).toBe('server');
      expect(classifyStatusCode(503)).toBe('server');
      expect(classifyStatusCode(504)).toBe('server');
      expect(classifyStatusCode(599)).toBe('server');
    });

    it('should classify other codes as unknown', () => {
      expect(classifyStatusCode(200)).toBe('unknown');
      expect(classifyStatusCode(300)).toBe('unknown');
      expect(classifyStatusCode(600)).toBe('unknown');
    });
  });

  describe('createErrorFromResponse', () => {
    it('should create error from 404 response', async () => {
      const response = new Response(null, {
        status: 404,
        statusText: 'Not Found',
      });

      const error = await createErrorFromResponse(response, {
        method: 'GET',
        requestId: 'req-123',
      });

      expect(error.type).toBe('client');
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('404');
      expect(error.details.method).toBe('GET');
      expect(error.details.requestId).toBe('req-123');
    });

    it('should create error from 500 response', async () => {
      const response = new Response(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      const error = await createErrorFromResponse(response);

      expect(error.type).toBe('server');
      expect(error.statusCode).toBe(500);
      expect(error.message).toContain('500');
    });

    it('should extract error message from JSON response', async () => {
      const response = new Response(
        JSON.stringify({ message: 'Custom error message' }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'content-type': 'application/json' },
        }
      );

      const error = await createErrorFromResponse(response);

      expect(error.message).toBe('Custom error message');
    });

    it('should extract error from JSON error field', async () => {
      const response = new Response(
        JSON.stringify({ error: 'Validation failed' }),
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: { 'content-type': 'application/json' },
        }
      );

      const error = await createErrorFromResponse(response);

      expect(error.message).toBe('Validation failed');
    });

    it('should use text body for short text responses', async () => {
      const response = new Response('Short error text', {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'text/plain' },
      });

      const error = await createErrorFromResponse(response);

      expect(error.message).toBe('Short error text');
    });

    it('should use default message for long text responses', async () => {
      const longText = 'x'.repeat(300);
      const response = new Response(longText, {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'text/plain' },
      });

      const error = await createErrorFromResponse(response);

      expect(error.message).toBe('HTTP 400: Bad Request');
    });

    it('should handle response body read errors gracefully', async () => {
      // Create a response with a body that can't be read twice
      const response = new Response('test', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Consume the body first
      await response.text();

      const error = await createErrorFromResponse(response);

      // Should still create error with default message
      expect(error.type).toBe('server');
      expect(error.message).toContain('500');
    });
  });
});
