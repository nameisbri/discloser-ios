/**
 * Content Hash Utility Tests
 *
 * Tests text normalization, SimHash computation, and the full content
 * hash generation pipeline.
 */

// Mock expo-crypto before importing contentHash
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mockedhash123'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

import { normalizeTextForHashing, computeSimHash, generateContentHash } from '../../../lib/utils/contentHash';

describe('normalizeTextForHashing', () => {
  test('converts to lowercase', () => {
    expect(normalizeTextForHashing('HELLO WORLD')).toBe('hello world');
    expect(normalizeTextForHashing('Mixed Case Text')).toBe('mixed case text');
  });

  test('removes punctuation', () => {
    expect(normalizeTextForHashing('Hello, World!')).toBe('hello world');
    expect(normalizeTextForHashing('Result: POSITIVE')).toBe('result positive');
    expect(normalizeTextForHashing('HIV-1/2')).toBe('hiv12');
  });

  test('collapses whitespace', () => {
    expect(normalizeTextForHashing('hello   world')).toBe('hello world');
    expect(normalizeTextForHashing('hello\n\nworld')).toBe('hello world');
    expect(normalizeTextForHashing('hello\t\tworld')).toBe('hello world');
  });

  test('trims leading and trailing whitespace', () => {
    expect(normalizeTextForHashing('  hello  ')).toBe('hello');
    expect(normalizeTextForHashing('\nhello\n')).toBe('hello');
  });

  test('handles empty string', () => {
    expect(normalizeTextForHashing('')).toBe('');
  });

  test('handles string with only punctuation', () => {
    expect(normalizeTextForHashing('!!!...')).toBe('');
  });

  test('preserves numbers', () => {
    expect(normalizeTextForHashing('Test 123')).toBe('test 123');
    expect(normalizeTextForHashing('L12345678')).toBe('l12345678');
  });
});

describe('computeSimHash', () => {
  test('returns 16-character hex string for valid input', () => {
    const result = computeSimHash('hello world');
    expect(result).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(result)).toBe(true);
  });

  test('returns zero hash for empty string', () => {
    expect(computeSimHash('')).toBe('0000000000000000');
  });

  test('returns zero hash for single character', () => {
    expect(computeSimHash('a')).toBe('0000000000000000');
  });

  test('same input produces same hash', () => {
    const hash1 = computeSimHash('test document content');
    const hash2 = computeSimHash('test document content');
    expect(hash1).toBe(hash2);
  });

  test('different input produces different hash', () => {
    const hash1 = computeSimHash('document one content');
    const hash2 = computeSimHash('completely different text');
    expect(hash1).not.toBe(hash2);
  });

  test('similar input produces similar hash (low Hamming distance)', () => {
    const hash1 = computeSimHash('hiv negative syphilis negative chlamydia negative');
    const hash2 = computeSimHash('hiv negative syphilis negative chlamydia negitive'); // typo

    // Convert hex to binary to compute Hamming distance
    const bin1 = BigInt('0x' + hash1).toString(2).padStart(64, '0');
    const bin2 = BigInt('0x' + hash2).toString(2).padStart(64, '0');
    let hammingDistance = 0;
    for (let i = 0; i < 64; i++) {
      if (bin1[i] !== bin2[i]) hammingDistance++;
    }

    // Similar texts should have Hamming distance <= 10 (out of 64 bits)
    expect(hammingDistance).toBeLessThanOrEqual(10);
  });
});

describe('generateContentHash', () => {
  test('returns hash and simhash', async () => {
    const result = await generateContentHash('HIV-1/2 Antigen: Non-Reactive');
    expect(result.hash).toBeDefined();
    expect(result.simhash).toBeDefined();
    expect(typeof result.hash).toBe('string');
    expect(typeof result.simhash).toBe('string');
    expect(result.simhash).toHaveLength(16);
  });
});
