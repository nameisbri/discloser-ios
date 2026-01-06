// Main document parser - orchestrates text extraction and LLM parsing

import * as FileSystem from 'expo-file-system';
import { parseDocumentWithLLM } from './llmParser';
import { normalizeTestName } from './testNormalizer';
import { standardizeResult } from './resultStandardizer';
import { ParsedDocument, ParsedTest } from './types';

/**
 * Extracts text from a PDF file
 * Note: This only works for text-based PDFs. For scanned PDFs, you'll need OCR.
 */
async function extractTextFromPDF(uri: string): Promise<string> {
  // For now, we'll read the PDF as base64 and try to extract text
  // This is a limitation - for production, consider using a PDF parsing service
  // or OCR for scanned documents

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 to text (works for text-based PDFs)
    const text = atob(base64);

    // Remove non-printable characters and clean up
    const cleanText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();

    if (cleanText.length < 50) {
      throw new Error('PDF appears to be scanned or empty. Please use OCR or manual entry.');
    }

    return cleanText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('Unable to extract text from PDF. It may be scanned or image-based.');
  }
}

/**
 * Extracts text from an image using OCR
 * Note: Requires Google Cloud Vision API or similar OCR service
 */
async function extractTextFromImage(uri: string): Promise<string> {
  // Placeholder for OCR implementation
  // You would integrate Google Cloud Vision API here
  throw new Error('OCR not yet implemented. Please use manual entry for images.');
}

/**
 * Main function to parse a document (PDF or image) and extract STI test results
 */
export async function parseDocument(
  uri: string,
  mimeType: string
): Promise<ParsedDocument> {
  try {
    let extractedText: string;

    // Step 1: Extract text based on file type
    if (mimeType === 'application/pdf') {
      extractedText = await extractTextFromPDF(uri);
    } else if (mimeType.startsWith('image/')) {
      extractedText = await extractTextFromImage(uri);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

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
