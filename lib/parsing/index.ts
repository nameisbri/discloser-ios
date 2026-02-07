// Barrel export for parsing module

export { parseDocument, DocumentParsingError, determineTestType } from './documentParser';
export { normalizeTestName, isStatusSTI } from './testNormalizer';
export { standardizeResult } from './resultStandardizer';
export { deduplicateTestResults, createDeduplicationKey } from './testDeduplicator';
export {
  extractTextFromPDF,
  getPDFPageCount,
  validatePDF,
  isPDFExtractionAvailable,
} from './pdfParser';
export type { ParsedDocument, ParsedTest, LLMResponse, UserProfileForVerification } from './types';
export { groupParsedDocumentsByDate } from './dateGrouping';
export type { DeduplicationResult, TestConflict, DeduplicationStats } from './testDeduplicator';
export type { DateGroupedResult, ParsedDocumentForGrouping } from './dateGrouping';
export type { PDFExtractionResult, PDFExtractionOptions } from './pdfParser';
