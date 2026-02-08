/**
 * HTTP Client Tests
 *
 * Comprehensive tests for the HTTP client with retry logic:
 * - fetchWithRetry with exponential backoff
 * - Timeout handling with AbortController
 * - Request size validation
 * - Retry logic (network errors, 5xx, not 4xx)
 */

import { fetchWithRetry } from '../../../lib/http/httpClient';
import { NetworkRequestError } from '../../../lib/http/errors';

// Mock global fetch
global.fetch = jest.fn();

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => 'test-uuid'),
} as any;

describe('HTTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set __DEV__ to false to suppress logs during tests
    (global as any).__DEV__ = false;
  });

  describe('fetchWithRetry', () => {
    describe('Successful Requests', () => {
      it('should return response on successful request', async () => {
        const mockResponse = new Response('{"data": "test"}', {
          status: 200,
          statusText: 'OK',
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        const response = await fetchWithRetry('https://api.example.com/test');

        expect(response).toBe(mockResponse);
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should pass through fetch options', async () => {
        const mockResponse = new Response('{}', { status: 200 });
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        await fetchWithRetry('https://api.example.com/test', {
          method: 'POST',
          headers: { 'X-Custom': 'header' },
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/test',
          expect.objectContaining({
            method: 'POST',
            headers: { 'X-Custom': 'header' },
          })
        );
      });

      it('should include timeout AbortSignal', async () => {
        const mockResponse = new Response('{}', { status: 200 });
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        await fetchWithRetry('https://api.example.com/test', {
          timeout: 5000,
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/test',
          expect.objectContaining({
            signal: expect.any(Object),
          })
        );
      });
    });

    describe('Request Size Validation', () => {
      it('should validate string body size', async () => {
        const largeBody = 'x'.repeat(11 * 1024 * 1024); // 11 MB

        await expect(
          fetchWithRetry('https://api.example.com/test', {
            method: 'POST',
            body: largeBody,
          })
        ).rejects.toThrow('Request body too large');

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should allow requests under size limit', async () => {
        const mockResponse = new Response('{}', { status: 200 });
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        const smallBody = 'x'.repeat(100); // 100 bytes

        await fetchWithRetry('https://api.example.com/test', {
          method: 'POST',
          body: smallBody,
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should skip validation when disabled', async () => {
        const mockResponse = new Response('{}', { status: 200 });
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        const largeBody = 'x'.repeat(11 * 1024 * 1024); // 11 MB

        await fetchWithRetry('https://api.example.com/test', {
          method: 'POST',
          body: largeBody,
          validateSize: false,
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should handle Blob bodies', async () => {
        const mockResponse = new Response('{}', { status: 200 });
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        const blob = new Blob(['test data'], { type: 'text/plain' });

        await fetchWithRetry('https://api.example.com/test', {
          method: 'POST',
          body: blob,
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('Retry Logic', () => {
      it('should retry on network errors', async () => {
        (global.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(new Response('{}', { status: 200 }));

        const response = await fetchWithRetry('https://api.example.com/test', {
          maxRetries: 3,
          baseDelay: 10, // Speed up tests
        });

        expect(response.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it('should retry on 5xx server errors', async () => {
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce(new Response('{}', { status: 500 }))
          .mockResolvedValueOnce(new Response('{}', { status: 200 }));

        const response = await fetchWithRetry('https://api.example.com/test', {
          maxRetries: 3,
          baseDelay: 10,
        });

        expect(response.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it('should NOT retry on 4xx client errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(
          new Response('{}', { status: 400, statusText: 'Bad Request' })
        );

        await expect(
          fetchWithRetry('https://api.example.com/test', {
            maxRetries: 3,
            baseDelay: 10,
          })
        ).rejects.toThrow(NetworkRequestError);

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should use exponential backoff for retries', async () => {
        const startTime = Date.now();

        (global.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(new Response('{}', { status: 200 }));

        await fetchWithRetry('https://api.example.com/test', {
          maxRetries: 3,
          baseDelay: 100, // 100ms base delay
        });

        const duration = Date.now() - startTime;

        // First retry: 100ms, Second retry: 200ms
        // Total should be at least 300ms
        expect(duration).toBeGreaterThanOrEqual(250); // Account for execution time
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });

      it('should throw error after max retries exhausted', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        await expect(
          fetchWithRetry('https://api.example.com/test', {
            maxRetries: 2,
            baseDelay: 10,
          })
        ).rejects.toThrow(NetworkRequestError);

        // Initial attempt + 2 retries = 3 total
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });

      it('should respect maxRetries configuration', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        await expect(
          fetchWithRetry('https://api.example.com/test', {
            maxRetries: 0,
          })
        ).rejects.toThrow(NetworkRequestError);

        // Should only try once if maxRetries is 0
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('Timeout Handling', () => {
      it('should abort request on timeout', async () => {
        (global.fetch as jest.Mock).mockImplementation(
          (_url: string, options: any) => {
            return new Promise((resolve, reject) => {
              // Listen for abort signal
              const abortHandler = () => {
                const abortError = new Error('The operation was aborted');
                abortError.name = 'AbortError';
                reject(abortError);
              };

              if (options.signal) {
                options.signal.addEventListener('abort', abortHandler);
              }

              // Simulate long request
              setTimeout(() => {
                if (options.signal) {
                  options.signal.removeEventListener('abort', abortHandler);
                }
                resolve(new Response('{}', { status: 200 }));
              }, 5000);
            });
          }
        );

        await expect(
          fetchWithRetry('https://api.example.com/test', {
            timeout: 100, // 100ms timeout
            maxRetries: 0, // No retries for faster test
          })
        ).rejects.toThrow('timed out');

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should classify timeout as abort error', async () => {
        (global.fetch as jest.Mock).mockImplementation(
          (_url: string, options: any) => {
            return new Promise((resolve, reject) => {
              const abortHandler = () => {
                const abortError = new Error('The operation was aborted');
                abortError.name = 'AbortError';
                reject(abortError);
              };

              if (options.signal) {
                options.signal.addEventListener('abort', abortHandler);
              }

              setTimeout(() => {
                if (options.signal) {
                  options.signal.removeEventListener('abort', abortHandler);
                }
                resolve(new Response('{}', { status: 200 }));
              }, 5000);
            });
          }
        );

        try {
          await fetchWithRetry('https://api.example.com/test', {
            timeout: 100,
            maxRetries: 0,
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkRequestError);
          expect((error as NetworkRequestError).type).toBe('abort');
        }
      });
    });

    describe('Error Handling', () => {
      it('should wrap fetch errors in NetworkRequestError', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new Error('Connection refused')
        );

        try {
          await fetchWithRetry('https://api.example.com/test', {
            maxRetries: 0,
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkRequestError);
          expect((error as NetworkRequestError).type).toBe('network');
          expect((error as NetworkRequestError).message).toContain('Connection refused');
        }
      });

      it('should wrap HTTP errors in NetworkRequestError', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(
          new Response('{}', { status: 500, statusText: 'Internal Server Error' })
        );

        try {
          await fetchWithRetry('https://api.example.com/test', {
            maxRetries: 0,
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkRequestError);
          expect((error as NetworkRequestError).type).toBe('server');
          expect((error as NetworkRequestError).statusCode).toBe(500);
        }
      });

      it('should preserve request context in error', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

        try {
          await fetchWithRetry('https://api.example.com/test', {
            method: 'POST',
            maxRetries: 0,
            requestId: 'custom-id',
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkRequestError);
          const networkError = error as NetworkRequestError;
          expect(networkError.details.url).toBe('https://api.example.com/test');
          expect(networkError.details.method).toBe('POST');
          expect(networkError.details.requestId).toBe('custom-id');
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle undefined body', async () => {
        const mockResponse = new Response('{}', { status: 200 });
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        await fetchWithRetry('https://api.example.com/test');

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should handle null body', async () => {
        const mockResponse = new Response('{}', { status: 200 });
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        await fetchWithRetry('https://api.example.com/test', {
          body: null,
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should generate requestId if crypto.randomUUID is not available', async () => {
        const originalCrypto = global.crypto;
        (global as any).crypto = {}; // Remove randomUUID

        const mockResponse = new Response('{}', { status: 200 });
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

        await fetchWithRetry('https://api.example.com/test');

        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Restore
        global.crypto = originalCrypto;
      });

      it('should handle successful request on last retry attempt', async () => {
        (global.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('Error 1'))
          .mockRejectedValueOnce(new Error('Error 2'))
          .mockRejectedValueOnce(new Error('Error 3'))
          .mockResolvedValueOnce(new Response('{}', { status: 200 }));

        const response = await fetchWithRetry('https://api.example.com/test', {
          maxRetries: 3,
          baseDelay: 10,
        });

        expect(response.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
      });
    });
  });

});
