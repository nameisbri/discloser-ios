// Barrel export for parsing module

export { parseDocument, DocumentParsingError } from './documentParser';
export { normalizeTestName, isStatusSTI } from './testNormalizer';
export { standardizeResult } from './resultStandardizer';
export { deduplicateTestResults, createDeduplicationKey } from './testDeduplicator';
export type { ParsedDocument, ParsedTest, LLMResponse, UserProfileForVerification } from './types';
export type { DeduplicationResult, TestConflict, DeduplicationStats } from './testDeduplicator';
