/**
 * Logger Utility Tests
 *
 * Comprehensive tests for the centralized logging utility, covering:
 * - Environment-aware logging (__DEV__ mode detection)
 * - Log level methods (debug, info, warn, error)
 * - Timestamp and prefix formatting
 * - Circular reference handling
 * - Complex data type handling
 */

import { logger } from '../../../lib/utils/logger';

// Mock console methods to capture output
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('Logger Utility', () => {
  // Store original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // Store original __DEV__ value
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    // Replace console methods with mocks
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;

    // Clear all mocks
    jest.clearAllMocks();

    // Set __DEV__ to true by default
    (global as any).__DEV__ = true;
  });

  afterAll(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    // Restore original __DEV__ value
    (global as any).__DEV__ = originalDev;
  });

  describe('Environment Awareness', () => {
    it('should log when __DEV__ is true', () => {
      (global as any).__DEV__ = true;
      logger.info('Test message');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });

    it('should not log when __DEV__ is false', () => {
      (global as any).__DEV__ = false;
      logger.info('Test message');

      // With runtime __DEV__ check, logging should be suppressed when __DEV__ is false
      expect(mockConsole.info).toHaveBeenCalledTimes(0);
    });
  });

  describe('Log Levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message');

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      const call = mockConsole.debug.mock.calls[0][0] as string;
      expect(call).toContain('[Discloser]');
      expect(call).toContain('[DEBUG]');
      expect(call).toContain('Debug message');
    });

    it('should log info messages', () => {
      logger.info('Info message');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const call = mockConsole.info.mock.calls[0][0] as string;
      expect(call).toContain('[Discloser]');
      expect(call).toContain('[INFO ]'); // Padded to 5 characters
      expect(call).toContain('Info message');
    });

    it('should log warning messages', () => {
      logger.warn('Warning message');

      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      const call = mockConsole.warn.mock.calls[0][0] as string;
      expect(call).toContain('[Discloser]');
      expect(call).toContain('[WARN ]'); // Padded to 5 characters
      expect(call).toContain('Warning message');
    });

    it('should log error messages', () => {
      logger.error('Error message');

      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      const call = mockConsole.error.mock.calls[0][0] as string;
      expect(call).toContain('[Discloser]');
      expect(call).toContain('[ERROR]');
      expect(call).toContain('Error message');
    });
  });

  describe('Message Formatting', () => {
    it('should include timestamp in ISO format', () => {
      logger.info('Test');

      const call = mockConsole.info.mock.calls[0][0] as string;
      // Check for ISO timestamp pattern: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should include [Discloser] prefix', () => {
      logger.info('Test');

      const call = mockConsole.info.mock.calls[0][0] as string;
      expect(call).toContain('[Discloser]');
    });

    it('should format log level consistently', () => {
      logger.debug('Test');
      logger.info('Test');
      logger.warn('Test');
      logger.error('Test');

      // All levels should be padded to same length for column alignment
      const debugCall = mockConsole.debug.mock.calls[0][0] as string;
      const infoCall = mockConsole.info.mock.calls[0][0] as string;
      const warnCall = mockConsole.warn.mock.calls[0][0] as string;
      const errorCall = mockConsole.error.mock.calls[0][0] as string;

      expect(debugCall).toContain('[DEBUG]');
      expect(infoCall).toContain('[INFO ]'); // Padded
      expect(warnCall).toContain('[WARN ]'); // Padded
      expect(errorCall).toContain('[ERROR]');
    });
  });

  describe('Data Logging', () => {
    it('should log simple object data', () => {
      const data = { userId: 123, name: 'Test User' };
      logger.info('User logged in', data);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('"userId": 123');
      expect(dataCall).toContain('"name": "Test User"');
    });

    it('should log array data', () => {
      const data = [1, 2, 3, 4, 5];
      logger.info('Processing items', data);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('[');
      expect(dataCall).toContain('1');
      expect(dataCall).toContain('5');
    });

    it('should handle null data', () => {
      logger.info('Null data', null);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('null');
    });

    it('should handle undefined data', () => {
      logger.info('Undefined data', undefined);

      // When data is undefined, it shouldn't be logged as a separate argument
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.info.mock.calls[0].length).toBe(1); // Only message, no data
    });

    it('should handle string data', () => {
      logger.info('String data', 'additional info');

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('additional info');
    });

    it('should handle number data', () => {
      logger.info('Number data', 42);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('42');
    });

    it('should handle boolean data', () => {
      logger.info('Boolean data', true);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('true');
    });
  });

  describe('Circular Reference Handling', () => {
    it('should handle circular object references', () => {
      const circular: any = { name: 'Test' };
      circular.self = circular;

      logger.info('Circular object', circular);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('"name": "Test"');
      expect(dataCall).toContain('[Circular Reference]');
    });

    it('should handle circular array references', () => {
      const circular: any[] = [1, 2, 3];
      circular.push(circular);

      logger.info('Circular array', circular);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('[Circular Reference]');
    });

    it('should handle nested circular references', () => {
      const obj: any = {
        level1: {
          level2: {
            data: 'test',
          },
        },
      };
      obj.level1.level2.circular = obj;

      logger.info('Nested circular', obj);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('"data": "test"');
      expect(dataCall).toContain('[Circular Reference]');
    });
  });

  describe('Error Object Handling', () => {
    it('should log Error objects with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.error.mock.calls[0][2] as string;
      expect(dataCall).toContain('"name": "Error"');
      expect(dataCall).toContain('"message": "Test error"');
      expect(dataCall).toContain('"stack"');
    });

    it('should handle custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      logger.error('Custom error occurred', error);

      const dataCall = mockConsole.error.mock.calls[0][2] as string;
      expect(dataCall).toContain('"name": "CustomError"');
      expect(dataCall).toContain('"message": "Custom error message"');
    });

    it('should handle Error objects within complex structures', () => {
      const data = {
        request: { url: '/api/test' },
        error: new Error('Request failed'),
        timestamp: Date.now(),
      };

      logger.error('Request failed', data);

      const dataCall = mockConsole.error.mock.calls[0][2] as string;
      expect(dataCall).toContain('"url": "/api/test"');
      expect(dataCall).toContain('"name": "Error"');
      expect(dataCall).toContain('"message": "Request failed"');
    });
  });

  describe('Complex Data Structures', () => {
    it('should handle deeply nested objects', () => {
      const deep = {
        level1: {
          level2: {
            level3: {
              level4: {
                data: 'deep value',
              },
            },
          },
        },
      };

      logger.info('Deep object', deep);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('"data": "deep value"');
    });

    it('should handle mixed arrays and objects', () => {
      const mixed = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        metadata: {
          count: 2,
          tags: ['admin', 'user'],
        },
      };

      logger.info('Mixed structure', mixed);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('"name": "Alice"');
      expect(dataCall).toContain('"name": "Bob"');
      expect(dataCall).toContain('"count": 2');
      expect(dataCall).toContain('"admin"');
      expect(dataCall).toContain('"user"');
    });

    it('should handle objects with special characters in values', () => {
      const special = {
        message: 'Line 1\nLine 2\tTabbed',
        json: '{"nested": "json"}',
        unicode: '🚀 Unicode test',
      };

      logger.info('Special chars', special);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      // JSON.stringify will escape special characters
      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('Line 1');
      expect(dataCall).toContain('Line 2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object', () => {
      logger.info('Empty object', {});

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('{}');
    });

    it('should handle empty array', () => {
      logger.info('Empty array', []);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('[]');
    });

    it('should handle empty string', () => {
      logger.info('Empty string', '');

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('');
    });

    it('should handle zero', () => {
      logger.info('Zero value', 0);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('0');
    });

    it('should handle false', () => {
      logger.info('False value', false);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('false');
    });

    it('should handle NaN', () => {
      logger.info('NaN value', NaN);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('NaN'); // Number converted to string
    });

    it('should handle Infinity', () => {
      logger.info('Infinity value', Infinity);

      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toBe('Infinity'); // Number converted to string
    });
  });

  describe('Multiple Arguments', () => {
    it('should log message without data', () => {
      logger.info('Simple message');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.info.mock.calls[0].length).toBe(1);
      const call = mockConsole.info.mock.calls[0][0] as string;
      expect(call).toContain('Simple message');
    });

    it('should log message with data', () => {
      logger.info('Message with data', { key: 'value' });

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.info.mock.calls[0].length).toBe(3); // message, separator, data
      const call = mockConsole.info.mock.calls[0][0] as string;
      expect(call).toContain('Message with data');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should log HTTP request with details', () => {
      const requestData = {
        method: 'POST',
        url: 'https://api.example.com/upload',
        headers: { 'Content-Type': 'application/json' },
        body: { documentId: 'abc123' },
      };

      logger.info('HTTP request initiated', requestData);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.info.mock.calls[0][2] as string;
      expect(dataCall).toContain('"method": "POST"');
      expect(dataCall).toContain('https://api.example.com/upload');
      expect(dataCall).toContain('"documentId": "abc123"');
    });

    it('should log retry attempt with context', () => {
      const retryContext = {
        attempt: 2,
        maxAttempts: 3,
        delay: 2000,
        error: new Error('Network timeout'),
      };

      logger.warn('Retrying request', retryContext);

      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.warn.mock.calls[0][2] as string;
      expect(dataCall).toContain('"attempt": 2');
      expect(dataCall).toContain('"maxAttempts": 3');
      expect(dataCall).toContain('Network timeout');
    });

    it('should log parsing error with document details', () => {
      const errorContext = {
        documentId: 'doc-456',
        fileName: 'test-results.pdf',
        error: new Error('Failed to extract text'),
        retryable: true,
      };

      logger.error('Document parsing failed', errorContext);

      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      const dataCall = mockConsole.error.mock.calls[0][2] as string;
      expect(dataCall).toContain('"documentId": "doc-456"');
      expect(dataCall).toContain('"fileName": "test-results.pdf"');
      expect(dataCall).toContain('Failed to extract text');
      expect(dataCall).toContain('"retryable": true');
    });
  });
});
