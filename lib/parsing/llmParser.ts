// LLM-based document parser using OpenRouter

import { LLMResponse } from './types';
import { fetchWithRetry, NetworkRequestError } from '../http';
import { logger } from '../utils/logger';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.3-70b-instruct:free'; // Fast and free

const SYSTEM_PROMPT = `You are a medical document parser that extracts STI test results from lab reports.

Your task is to extract:
1. Collection date (when the sample was collected) - look for "Date Collected", "Date of Collection", "Date of Service"
2. Specimen source (e.g., "Urine", "Whole blood")
3. All STI test results CONSOLIDATED by disease/infection type

CONSOLIDATION RULES - COMBINE related rows into ONE entry per disease:
- HIV: All HIV-related rows (HIV1/2 Ag/Ab, HIV Final Interpretation, etc.) → one "HIV" entry
- Hepatitis A: All Hep A rows → one "Hepatitis A" entry
- Hepatitis B: All Hep B rows (Surface Antigen, Core Antibody, Surface Antibody, Immune Status, Interpretation) → one "Hepatitis B" entry
- Hepatitis C: All Hep C rows (Antibody, Virus Interpretation) → one "Hepatitis C" entry
- Syphilis: All Syphilis rows (Antibody Screen, Serology Interpretation) → one "Syphilis" entry
- Herpes: HSV-1 and HSV-2 as SEPARATE entries if both tested (they can have different results)
- Chlamydia: All Chlamydia rows → one "Chlamydia" entry
- Gonorrhea: All Gonorrhea/N. gonorrhoeae rows → one "Gonorrhea" entry

RESULT INTERPRETATION:
- Use the INTERPRETATION row when available (e.g., "No evidence of infection", "Evidence of immunity")
- For simple results use: "Negative", "Positive", "Immune", "Pending"
- "Evidence of immunity" or "Immune" = person is protected (from vaccine or past infection) - use "Immune"
- "Non-Reactive", "Not Detected", "Negative" = no current infection - use "Negative"
- "Reactive", "Detected", "Positive" = infection detected - use "Positive"
- "Pending", "Referred to PHL" = awaiting results - use "Pending"

LAB FORMAT NOTES:
- Public Health Ontario: Has "Test" + "Interpretation" rows - use interpretation for result
- LifeLabs: May have UPPERCASE monospace format or formatted tables
- Look for collection date in header area, not result dates

RULES:
- Return ONLY valid JSON, no markdown, no explanation
- Use simple disease names (e.g., "HIV" not "HIV1/2 Ag/Ab Combo Screen")
- If collection date not found, use null
- Ignore non-STI tests (e.g., liver enzymes, ALT) unless they relate to hepatitis interpretation

TEST TYPE/TITLE:
- Suggest a concise title for this test panel based on what was tested
- Examples: "Full STI Panel", "HIV & Hepatitis Panel", "Routine STI Screening", "Chlamydia & Gonorrhea Test"
- If many different tests, use "Full STI Panel" or "Comprehensive STI Panel"

NOTES EXTRACTION:
- Extract any important notes, comments, or recommendations from the lab/doctor
- Include follow-up recommendations, clinical interpretations, or warnings
- Do NOT include boilerplate text like "results should be interpreted in context of clinical history"

VERIFICATION FIELDS (for document authenticity):
- lab_name: Name of the laboratory (e.g., "LifeLabs", "Public Health Ontario", "Dynacare", "BC CDC", "Alberta Precision Labs")
- patient_name: Patient's full name as shown on document
- health_card_present: true if a Canadian health card number is visible (OHIP, MSP, Alberta Health, RAMQ, etc.)
- accession_number: Lab specimen/requisition/accession number if present

Example output:
{
  "collection_date": "2024-09-18",
  "specimen_source": "Whole blood",
  "test_type": "Full STI Panel",
  "tests": [
    {"name": "HIV", "result": "Negative"},
    {"name": "Hepatitis A", "result": "Immune"},
    {"name": "Hepatitis B", "result": "Immune"},
    {"name": "Hepatitis C", "result": "Negative"},
    {"name": "Syphilis", "result": "Negative"},
    {"name": "Chlamydia", "result": "Negative"},
    {"name": "Gonorrhea", "result": "Negative"}
  ],
  "notes": null,
  "lab_name": "LifeLabs",
  "patient_name": "John Smith",
  "health_card_present": true,
  "accession_number": "L12345678"
}`;

/**
 * Validates that text is valid UTF-8 encoding.
 * Invalid UTF-8 can cause issues with JSON serialization and LLM processing.
 *
 * @param text - The text to validate
 * @returns True if valid UTF-8, false otherwise
 */
function isValidUTF8(text: string): boolean {
  try {
    // Attempt to encode and decode the text
    // If it contains invalid UTF-8 sequences, this will fail
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const encoded = encoder.encode(text);
    decoder.decode(encoded);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates the size of a request payload in bytes.
 *
 * @param payload - The payload object to measure
 * @returns Size in bytes
 */
function calculatePayloadSize(payload: unknown): number {
  const jsonString = JSON.stringify(payload);
  // Use TextEncoder for accurate byte count (handles multi-byte UTF-8 characters)
  const encoder = new TextEncoder();
  return encoder.encode(jsonString).length;
}

/**
 * Formats a byte size into a human-readable string (KB or MB).
 *
 * @param bytes - Size in bytes
 * @returns Formatted string with appropriate unit
 */
function formatSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export async function parseDocumentWithLLM(text: string): Promise<LLMResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('EXPO_PUBLIC_OPENROUTER_API_KEY is not configured');
  }

  // Validate text encoding
  if (!isValidUTF8(text)) {
    const error = new Error(
      'Document contains invalid UTF-8 encoding. Please ensure the document is properly encoded.'
    );
    logger.error('LLM parser: Invalid UTF-8 encoding detected', { textLength: text.length });
    throw error;
  }

  // Limit text to ~100k chars (roughly 25k tokens) to avoid context limits
  const truncatedText = text.length > 100000 ? text.substring(0, 100000) : text;
  const wasTruncated = text.length > 100000;

  if (wasTruncated) {
    logger.warn('LLM parser: Text truncated to fit context window', {
      originalLength: text.length,
      truncatedLength: truncatedText.length,
    });
  }

  // Build request payload
  const requestPayload = {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Extract STI test results from this lab report:\n\n${truncatedText}`,
      },
    ],
    temperature: 0.1, // Low temperature for consistent extraction
    max_tokens: 2000,
  };

  // Calculate and log request size
  const payloadSize = calculatePayloadSize(requestPayload);
  const payloadSizeFormatted = formatSize(payloadSize);

  logger.info('LLM parser: Sending request to OpenRouter', {
    url: OPENROUTER_API_URL,
    model: MODEL,
    payloadSize: payloadSizeFormatted,
    textLength: truncatedText.length,
    wasTruncated,
  });

  try {
    const startTime = Date.now();

    // Use fetchWithRetry with 30s timeout and 3 retries
    const response = await fetchWithRetry(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://discloser.app',
        'X-Title': 'Discloser STI Test Parser',
      },
      body: JSON.stringify(requestPayload),
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      baseDelay: 1000, // 1 second, exponential backoff: 1s, 2s, 4s
    });

    const duration = Date.now() - startTime;

    // Parse response
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    logger.info('LLM parser: Received response from OpenRouter', {
      duration,
      responseSize: content ? formatSize(content.length) : '0 KB',
      hasContent: !!content,
    });

    if (!content) {
      const error = new Error(
        `No content in LLM response. URL: ${OPENROUTER_API_URL}, Payload size: ${payloadSizeFormatted}`
      );
      logger.error('LLM parser: Empty response from LLM', { data });
      throw error;
    }

    // Strip markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      const error = new Error(
        `Failed to parse LLM response as JSON. URL: ${OPENROUTER_API_URL}, Payload size: ${payloadSizeFormatted}`
      );
      logger.error('LLM parser: JSON parse error', {
        parseError,
        contentPreview: content.substring(0, 200),
      });
      throw error;
    }

    // Validate response structure
    if (!parsed.tests || !Array.isArray(parsed.tests)) {
      const error = new Error(
        `Invalid LLM response structure (missing 'tests' array). URL: ${OPENROUTER_API_URL}, Payload size: ${payloadSizeFormatted}`
      );
      logger.error('LLM parser: Invalid response structure', { parsed });
      throw error;
    }

    logger.info('LLM parser: Successfully parsed document', {
      testCount: parsed.tests.length,
      collectionDate: parsed.collection_date,
      testType: parsed.test_type,
    });

    return parsed;
  } catch (error) {
    // Enhanced error handling with diagnostics
    if (error instanceof NetworkRequestError) {
      // Network error from fetchWithRetry - already has good diagnostics
      logger.error('LLM parser: Network request failed', {
        errorType: error.type,
        statusCode: error.statusCode,
        details: error.details,
      });

      // Add more context to the error message
      const enhancedMessage = `OpenRouter API request failed: ${error.message} (Type: ${error.type}, Payload size: ${payloadSizeFormatted})`;
      const enhancedError = new Error(enhancedMessage);
      // Preserve the original error for stack trace
      (enhancedError as any).cause = error;
      throw enhancedError;
    }

    // Other errors (parsing, validation, etc.)
    logger.error('LLM parser: Unexpected error', {
      error,
      url: OPENROUTER_API_URL,
      payloadSize: payloadSizeFormatted,
    });

    // Re-throw with additional context if not already enhanced
    if (error instanceof Error && !error.message.includes('Payload size:')) {
      const enhancedMessage = `${error.message} (URL: ${OPENROUTER_API_URL}, Payload size: ${payloadSizeFormatted})`;
      const enhancedError = new Error(enhancedMessage);
      (enhancedError as any).cause = error;
      throw enhancedError;
    }

    throw error;
  }
}
