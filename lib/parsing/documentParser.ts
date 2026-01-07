// Main document parser - orchestrates text extraction and LLM parsing

import * as FileSystem from 'expo-file-system/legacy';
import { parseDocumentWithLLM } from './llmParser';
import { normalizeTestName } from './testNormalizer';
import { standardizeResult } from './resultStandardizer';
import { ParsedDocument, ParsedTest } from './types';

/**
 * Extracts text from an image using Google Cloud Vision OCR
 */
async function extractTextFromImage(uri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('Google Vision API key not configured');
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OCR failed: ${error}`);
  }

  const data = await response.json();
  const text = data.responses?.[0]?.fullTextAnnotation?.text;

  if (!text || text.length < 20) {
    throw new Error('No text found in image');
  }

  return text;
}

/**
 * Main function to parse an image and extract STI test results
 */
export async function parseDocument(
  uri: string,
  mimeType: string
): Promise<ParsedDocument> {
  try {
    // Step 1: Extract text from image using OCR
    const extractedText = await extractTextFromImage(uri);

    console.log('Extracted text length:', extractedText.length);

    // Step 2: Parse with LLM
    const llmResponse = await parseDocumentWithLLM(extractedText);

    // Step 3: Normalize and standardize results
    const tests: ParsedTest[] = llmResponse.tests.map((test) => {
      const normalizedName = normalizeTestName(test.name);
      const status = standardizeResult(test.result);

      return {
        name: normalizedName,
        result: test.result,
        status,
        notes: test.notes,
      };
    });

    // Step 4: Determine overall test type
    const testType = determineTestType(tests);

    // Step 5: Format collection date
    const collectionDate = formatDate(llmResponse.collection_date);

    return {
      collectionDate,
      testType,
      tests,
      rawText: extractedText.substring(0, 500), // Store first 500 chars for debugging
    };
  } catch (error) {
    console.error('Document parsing error:', error);
    throw error;
  }
}

/**
 * Determines the overall test type based on tests found
 */
function determineTestType(tests: ParsedTest[]): string {
  const categories = tests.map((test) => {
    if (test.name.includes('HIV')) return 'HIV';
    if (test.name.includes('Hepatitis')) return 'Hepatitis';
    if (test.name.includes('Syphilis')) return 'Syphilis';
    if (test.name.includes('Gonorrhea') || test.name.includes('Chlamydia')) return 'STI';
    if (test.name.includes('Herpes')) return 'Herpes';
    return 'Other';
  });

  const uniqueCategories = [...new Set(categories)];

  // If multiple categories, call it a "Full Panel"
  if (uniqueCategories.length > 2) {
    return 'Full STI Panel';
  }

  // If mostly one category, use that
  const mostCommon = uniqueCategories[0] || 'STI Panel';
  return `${mostCommon} Test`;
}

/**
 * Formats date to YYYY-MM-DD
 */
function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;

  try {
    // Handle various date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
}
