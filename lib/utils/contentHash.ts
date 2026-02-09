/**
 * Content Hash Utility
 *
 * Generates content fingerprints for detecting duplicate or near-duplicate
 * document uploads. Uses both exact SHA-256 hashing and locality-sensitive
 * SimHash to support exact and fuzzy duplicate detection.
 *
 * SHA-256 catches identical documents after OCR normalization.
 * SimHash catches near-duplicates where minor OCR variations exist
 * (e.g., a character misread, extra whitespace, slightly different crop).
 */

import * as Crypto from 'expo-crypto';

export interface ContentHashResult {
  hash: string;
  simhash: string;
}

/** Number of bits in the SimHash fingerprint */
const SIMHASH_BITS = 64;

/** Hex string representing a 64-bit zero SimHash */
const ZERO_SIMHASH = '0000000000000000';

/**
 * Computes a simple numeric hash for a character bigram.
 * Uses the djb2-style shift-and-add algorithm to produce
 * a 32-bit integer from a two-character string.
 *
 * @param bigram - A two-character string to hash
 * @returns A 32-bit integer hash value
 */
function hashBigram(bigram: string): number {
  let hash = 0;
  for (let i = 0; i < bigram.length; i++) {
    hash = ((hash << 5) - hash + bigram.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Normalizes OCR text for consistent hashing.
 *
 * Applies a series of transformations to ensure that minor OCR variations
 * (punctuation differences, extra whitespace, casing) do not produce
 * different hashes for semantically identical documents.
 *
 * Normalization steps:
 * 1. Convert to lowercase
 * 2. Remove all punctuation (keep only alphanumeric and spaces)
 * 3. Collapse all whitespace to single spaces
 * 4. Trim leading and trailing whitespace
 *
 * @param text - Raw OCR text to normalize
 * @returns Normalized text suitable for hashing
 *
 * @example
 * normalizeTextForHashing('  Hello, World!  ')
 * // returns 'hello world'
 *
 * @example
 * normalizeTextForHashing('Test\n\nResult:  POSITIVE')
 * // returns 'test result positive'
 */
export function normalizeTextForHashing(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes a SimHash fingerprint for locality-sensitive duplicate detection.
 *
 * SimHash is a locality-sensitive hashing technique where similar inputs
 * produce similar hashes. This allows detection of near-duplicate documents
 * by comparing the Hamming distance between their SimHash values.
 *
 * Algorithm:
 * 1. Split text into overlapping character bigrams (sliding window of 2)
 * 2. Hash each bigram to a 32-bit integer
 * 3. For each hash, update a 64-bit vector: increment for 1 bits, decrement for 0 bits
 * 4. Reduce the vector: positive values become 1, negative/zero become 0
 * 5. Encode the resulting 64-bit fingerprint as a 16-character hex string
 *
 * @param text - Normalized text to compute SimHash for
 * @returns A 16-character hex string representing the 64-bit SimHash
 *
 * @example
 * computeSimHash('hello world')
 * // returns a 16-character hex string like 'a1b2c3d4e5f6a7b8'
 *
 * @example
 * computeSimHash('')
 * // returns '0000000000000000'
 */
export function computeSimHash(text: string): string {
  if (text.length < 2) {
    return ZERO_SIMHASH;
  }

  // Initialize a 64-element vector to accumulate bit weights
  const vector: number[] = new Array(SIMHASH_BITS).fill(0);

  // Generate character bigrams and accumulate their hash bits
  for (let i = 0; i < text.length - 1; i++) {
    const bigram = text.substring(i, i + 2);
    const bigramHash = hashBigram(bigram);

    for (let bit = 0; bit < SIMHASH_BITS; bit++) {
      // Use the hash value directly for bits 0-31, and a derived
      // value for bits 32-63 to fill the full 64-bit fingerprint
      const hashValue = bit < 32 ? bigramHash : hashBigram(bigram + String(bit));
      const bitPosition = bit < 32 ? bit : bit - 32;

      if ((hashValue >>> bitPosition) & 1) {
        vector[bit] += 1;
      } else {
        vector[bit] -= 1;
      }
    }
  }

  // Convert the vector to a 64-bit binary string, then to hex
  let binaryString = '';
  for (let i = 0; i < SIMHASH_BITS; i++) {
    binaryString += vector[i] >= 0 ? '1' : '0';
  }

  // Convert 64-bit binary string to 16-character hex string
  let hexString = '';
  for (let i = 0; i < SIMHASH_BITS; i += 4) {
    const nibble = binaryString.substring(i, i + 4);
    hexString += parseInt(nibble, 2).toString(16);
  }

  return hexString;
}

/**
 * Generates content fingerprints for a document's OCR text.
 *
 * Produces two complementary hashes:
 * - `hash`: SHA-256 of normalized text for exact duplicate detection
 * - `simhash`: SimHash of normalized text for near-duplicate detection
 *
 * The text is first normalized to remove OCR noise (punctuation, casing,
 * extra whitespace) so that minor extraction differences do not prevent
 * duplicate detection.
 *
 * @param text - Raw OCR text from document extraction
 * @returns Promise resolving to an object with `hash` and `simhash` strings
 *
 * @example
 * const result = await generateContentHash('HIV-1/2 Antigen: Non-Reactive');
 * // result.hash -> '3a7f2b...' (64-char SHA-256 hex)
 * // result.simhash -> 'a1b2c3d4e5f6a7b8' (16-char SimHash hex)
 */
/**
 * Computes the Hamming distance between two SimHash hex strings.
 *
 * The Hamming distance is the number of bit positions where the two
 * hashes differ. A low distance indicates the original texts are similar.
 *
 * @param hex1 - First SimHash as a 16-character hex string
 * @param hex2 - Second SimHash as a 16-character hex string
 * @returns Number of differing bits (0 = identical, 64 = maximally different)
 *
 * @example
 * hammingDistance('ffffffffffffffff', 'fffffffffffffffe')
 * // returns 1 (only the last bit differs)
 *
 * @example
 * hammingDistance('0000000000000000', 'ffffffffffffffff')
 * // returns 64 (all bits differ)
 */
export function hammingDistance(hex1: string, hex2: string): number {
  if (!hex1 || !hex2 || hex1.length !== 16 || hex2.length !== 16) {
    return 64; // max distance if invalid input
  }

  let distance = 0;

  // Compare nibble by nibble (4 bits at a time)
  for (let i = 0; i < 16; i++) {
    const xor = parseInt(hex1[i], 16) ^ parseInt(hex2[i], 16);
    // Count set bits in the XOR result (popcount for 4 bits)
    distance += ((xor >> 0) & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
  }

  return distance;
}

export async function generateContentHash(text: string): Promise<ContentHashResult> {
  const normalizedText = normalizeTextForHashing(text);

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalizedText
  );

  const simhash = computeSimHash(normalizedText);

  return { hash, simhash };
}
