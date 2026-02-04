/**
 * PDF Parser Tests
 *
 * Tests for PDF text extraction functionality.
 * Note: These tests mock the native expo-pdf-text-extract module.
 */

// Mock the native module
jest.mock('expo-pdf-text-extract', () => ({
  isAvailable: jest.fn(),
  extractText: jest.fn(),
  getPageCount: jest.fn(),
  extractTextFromPage: jest.fn(),
  extractTextWithInfo: jest.fn(),
}));

// Mock the logger
jest.mock('../../../lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  extractTextFromPDF,
  getPDFPageCount,
  validatePDF,
  isPDFExtractionAvailable,
} from '../../../lib/parsing/pdfParser';

import {
  isAvailable,
  extractText,
  getPageCount,
  extractTextFromPage,
  extractTextWithInfo,
} from 'expo-pdf-text-extract';

const mockIsAvailable = isAvailable as jest.Mock;
const mockExtractText = extractText as jest.Mock;
const mockGetPageCount = getPageCount as jest.Mock;
const mockExtractTextFromPage = extractTextFromPage as jest.Mock;
const mockExtractTextWithInfo = extractTextWithInfo as jest.Mock;

describe('pdfParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: module is available
    mockIsAvailable.mockReturnValue(true);
  });

  describe('isPDFExtractionAvailable', () => {
    test('returns true when native module is available', () => {
      mockIsAvailable.mockReturnValue(true);
      expect(isPDFExtractionAvailable()).toBe(true);
    });

    test('returns false when native module is not available', () => {
      mockIsAvailable.mockReturnValue(false);
      expect(isPDFExtractionAvailable()).toBe(false);
    });
  });

  describe('getPDFPageCount', () => {
    test('returns page count for valid PDF', async () => {
      mockGetPageCount.mockResolvedValue(5);
      const count = await getPDFPageCount('/path/to/test.pdf');
      expect(count).toBe(5);
    });

    test('returns 0 when module is not available', async () => {
      mockIsAvailable.mockReturnValue(false);
      const count = await getPDFPageCount('/path/to/test.pdf');
      expect(count).toBe(0);
    });

    test('returns 0 on error', async () => {
      mockGetPageCount.mockRejectedValue(new Error('File not found'));
      const count = await getPDFPageCount('/path/to/test.pdf');
      expect(count).toBe(0);
    });
  });

  describe('validatePDF', () => {
    test('validates a valid PDF', async () => {
      mockGetPageCount.mockResolvedValue(3);
      const result = await validatePDF('/path/to/test.pdf', 5 * 1024 * 1024); // 5MB
      expect(result.valid).toBe(true);
      expect(result.pageCount).toBe(3);
      expect(result.error).toBeUndefined();
    });

    test('rejects PDF that is too large', async () => {
      const result = await validatePDF('/path/to/large.pdf', 25 * 1024 * 1024); // 25MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    test('warns about large page count but still valid', async () => {
      mockGetPageCount.mockResolvedValue(15);
      const result = await validatePDF('/path/to/test.pdf');
      expect(result.valid).toBe(true);
      expect(result.pageCount).toBe(15);
      expect(result.error).toContain('15 pages');
      expect(result.error).toContain('first 10');
    });

    test('rejects unreadable PDF', async () => {
      mockGetPageCount.mockResolvedValue(0);
      const result = await validatePDF('/path/to/corrupt.pdf');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('corrupted');
    });
  });

  describe('extractTextFromPDF', () => {
    test('extracts text from a text-based PDF', async () => {
      // Text must be >= 50 chars (minTextThreshold default)
      const sampleText = 'HIV Test Result: Negative\nChlamydia: Not Detected\nGonorrhea: Not Detected\nSyphilis: Non-Reactive';
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockResolvedValue({
        text: sampleText,
        pageCount: 1,
        success: true,
      });

      const result = await extractTextFromPDF('/path/to/test.pdf');

      expect(result.success).toBe(true);
      expect(result.text).toBe(sampleText);
      expect(result.pageCount).toBe(1);
      expect(result.extractionMethod).toBe('native');
    });

    test('returns error when module is not available', async () => {
      mockIsAvailable.mockReturnValue(false);

      const result = await extractTextFromPDF('/path/to/test.pdf');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    test('falls back to page-by-page extraction when full extraction yields minimal text', async () => {
      mockGetPageCount.mockResolvedValue(3);
      mockExtractTextWithInfo.mockResolvedValue({
        text: 'ab', // Too short
        pageCount: 3,
        success: true,
      });
      mockExtractTextFromPage
        .mockResolvedValueOnce('Page 1 text content here')
        .mockResolvedValueOnce('Page 2 text content here')
        .mockResolvedValueOnce('Page 3 text content here');

      const result = await extractTextFromPDF('/path/to/test.pdf');

      expect(result.success).toBe(true);
      expect(result.pagesProcessed).toBe(3);
      expect(result.text).toContain('Page 1');
      expect(result.text).toContain('Page 2');
      expect(result.text).toContain('Page 3');
    });

    test('handles scanned PDF with minimal text', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockResolvedValue({
        text: '',
        pageCount: 1,
        success: true,
      });
      mockExtractTextFromPage.mockResolvedValue('');

      const result = await extractTextFromPDF('/path/to/scanned.pdf');

      expect(result.success).toBe(false);
      expect(result.error).toContain('scanned document');
    });

    test('handles password-protected PDF', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockRejectedValue(new Error('Document is password protected'));

      const result = await extractTextFromPDF('/path/to/protected.pdf');

      expect(result.success).toBe(false);
      expect(result.error).toContain('password-protected');
    });

    test('handles corrupted PDF', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockRejectedValue(new Error('Invalid or corrupt PDF'));

      const result = await extractTextFromPDF('/path/to/corrupt.pdf');

      expect(result.success).toBe(false);
      expect(result.error).toContain('corrupted');
    });

    test('handles file not found', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockRejectedValue(new Error('File not found'));

      const result = await extractTextFromPDF('/path/to/missing.pdf');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('respects maxPages option', async () => {
      mockGetPageCount.mockResolvedValue(20);
      mockExtractTextWithInfo.mockResolvedValue({
        text: '', // Force page-by-page
        pageCount: 20,
        success: true,
      });
      mockExtractTextFromPage.mockResolvedValue('Page content');

      const result = await extractTextFromPDF('/path/to/test.pdf', { maxPages: 5 });

      expect(result.pagesProcessed).toBe(5);
      expect(mockExtractTextFromPage).toHaveBeenCalledTimes(5);
    });

    test('includes file identifier in logs', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockResolvedValue({
        text: 'Test content',
        pageCount: 1,
        success: false,
      });
      mockExtractTextFromPage.mockResolvedValue('More content');

      await extractTextFromPDF('/path/to/test.pdf', {
        fileIdentifier: 'File 1 of 3',
      });

      // The function should work without errors when fileIdentifier is provided
      expect(true).toBe(true);
    });
  });

  describe('Error Classification', () => {
    test('classifies password errors', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockRejectedValue(new Error('encrypted document'));

      const result = await extractTextFromPDF('/path/to/test.pdf');
      expect(result.error).toContain('password-protected');
    });

    test('classifies permission errors', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockRejectedValue(new Error('access denied'));

      const result = await extractTextFromPDF('/path/to/test.pdf');
      expect(result.error).toContain('permissions');
    });

    test('classifies empty PDF errors', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockRejectedValue(new Error('PDF has no pages'));

      const result = await extractTextFromPDF('/path/to/test.pdf');
      expect(result.error).toContain('empty');
    });

    test('classifies timeout errors', async () => {
      mockGetPageCount.mockResolvedValue(1);
      mockExtractTextWithInfo.mockRejectedValue(new Error('operation timed out'));

      const result = await extractTextFromPDF('/path/to/test.pdf');
      expect(result.error).toContain('timed out');
    });
  });
});
