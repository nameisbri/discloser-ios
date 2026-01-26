/**
 * Centralized Logger Utility
 *
 * Provides environment-aware logging with the following features:
 * - Only logs in __DEV__ mode for production safety
 * - Formats output with timestamp and consistent prefix
 * - Handles circular JSON structures gracefully
 * - Supports multiple log levels: debug, info, warn, error
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/utils/logger';
 *
 * logger.debug('Connection established', { userId: 123 });
 * logger.info('Processing document', { documentId: 'abc' });
 * logger.warn('Rate limit approaching', { remaining: 10 });
 * logger.error('Upload failed', error);
 * ```
 */

// Type definitions for better type safety
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogData = unknown;

/**
 * Logger class that provides structured logging with environment awareness.
 *
 * Design Decision: Using a class-based approach for potential future extensions
 * (e.g., log level filtering, remote logging, log persistence).
 */
class Logger {
  private readonly prefix = '[Discloser]';

  /**
   * Checks if we're in development mode at runtime.
   * This is checked on each log call to support dynamic environment changes in tests.
   */
  private get isDev(): boolean {
    return typeof __DEV__ !== 'undefined' && __DEV__;
  }

  /**
   * Formats a log message with timestamp and prefix.
   *
   * @param level - The log level
   * @param message - The primary message string
   * @returns Formatted message string
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5); // Align columns for readability
    return `${this.prefix} ${timestamp} [${levelStr}] ${message}`;
  }

  /**
   * Safely stringifies data, handling circular references.
   *
   * Strategy Pattern: Uses a replacer function to detect and handle circular references
   * without throwing errors, ensuring robust logging even with complex objects.
   *
   * @param data - Data to stringify
   * @returns Stringified data or error message
   */
  private safeStringify(data: LogData): string {
    if (data === undefined) return 'undefined';
    if (data === null) return 'null';
    if (typeof data === 'string') return data;
    if (typeof data === 'number' || typeof data === 'boolean') return String(data);

    try {
      // Track seen objects to detect circular references
      const seen = new WeakSet();

      return JSON.stringify(
        data,
        (key, value) => {
          // Handle special types
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack,
            };
          }

          // Handle circular references
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular Reference]';
            }
            seen.add(value);
          }

          return value;
        },
        2 // Pretty print with 2-space indentation
      );
    } catch (error) {
      // Fallback if JSON.stringify still fails
      return `[Unable to stringify: ${error instanceof Error ? error.message : 'unknown error'}]`;
    }
  }

  /**
   * Core logging method that handles the actual console output.
   *
   * Single Responsibility Principle: This method focuses solely on the
   * logging mechanism, while formatting is delegated to other methods.
   *
   * @param level - The log level
   * @param consoleMethod - The console method to use
   * @param message - The primary message
   * @param data - Optional additional data to log
   */
  private log(
    level: LogLevel,
    consoleMethod: (...args: unknown[]) => void,
    message: string,
    data?: LogData
  ): void {
    // Only log in development mode
    if (!this.isDev) return;

    const formattedMessage = this.formatMessage(level, message);

    if (data !== undefined) {
      const stringifiedData = this.safeStringify(data);
      consoleMethod(formattedMessage, '\n', stringifiedData);
    } else {
      consoleMethod(formattedMessage);
    }
  }

  /**
   * Logs debug-level messages (lowest severity).
   * Use for detailed diagnostic information during development.
   *
   * @param message - The debug message
   * @param data - Optional data to include
   */
  debug(message: string, data?: LogData): void {
    this.log('debug', console.debug, message, data);
  }

  /**
   * Logs info-level messages (informational).
   * Use for general application flow and state changes.
   *
   * @param message - The info message
   * @param data - Optional data to include
   */
  info(message: string, data?: LogData): void {
    this.log('info', console.info, message, data);
  }

  /**
   * Logs warning-level messages (potential issues).
   * Use for recoverable errors or degraded functionality.
   *
   * @param message - The warning message
   * @param data - Optional data to include
   */
  warn(message: string, data?: LogData): void {
    this.log('warn', console.warn, message, data);
  }

  /**
   * Logs error-level messages (highest severity).
   * Use for errors that prevent normal operation.
   *
   * @param message - The error message
   * @param data - Optional error object or data to include
   */
  error(message: string, data?: LogData): void {
    this.log('error', console.error, message, data);
  }
}

/**
 * Singleton logger instance.
 *
 * Design Pattern: Singleton ensures consistent logging behavior across the app
 * and prevents multiple logger instances with different configurations.
 */
export const logger = new Logger();
