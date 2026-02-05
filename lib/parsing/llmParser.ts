// LLM-based document parser using Supabase Edge Function
// API keys are kept server-side for security

import { LLMResponse } from "./types";
import { supabase } from "../supabase";
import { logger } from "../utils/logger";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

/**
 * Validates that text is valid UTF-8 encoding.
 * Invalid UTF-8 can cause issues with JSON serialization and LLM processing.
 */
function isValidUTF8(text: string): boolean {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const encoded = encoder.encode(text);
    decoder.decode(encoded);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a byte size into a human-readable string (KB or MB).
 */
function formatSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Parses document text using the parse-document Edge Function.
 * The Edge Function handles:
 * - Prompt sanitization
 * - LLM API calls (with server-side API key)
 * - Response parsing and validation
 */
export async function parseDocumentWithLLM(text: string): Promise<LLMResponse> {
  // Validate text encoding
  if (!isValidUTF8(text)) {
    logger.error("LLM parser: Invalid UTF-8 encoding detected", {
      textLength: text.length,
    });
    throw new Error(
      "Document contains invalid UTF-8 encoding. Please ensure the document is properly encoded."
    );
  }

  const textLength = text.length;
  const textSizeFormatted = formatSize(new TextEncoder().encode(text).length);

  logger.info("LLM parser: Sending request to Edge Function", {
    textLength,
    textSize: textSizeFormatted,
  });

  try {
    const startTime = Date.now();

    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Not authenticated. Please sign in to parse documents.");
    }

    // Call the Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({ text }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      logger.error("LLM parser: Edge Function request failed", {
        status: response.status,
        error: errorData.error,
        duration,
      });
      throw new Error(errorData.error || `LLM parsing failed with status ${response.status}`);
    }

    const parsed: LLMResponse = await response.json();

    // Validate response structure
    if (!parsed.tests || !Array.isArray(parsed.tests)) {
      logger.error("LLM parser: Invalid response structure", { parsed });
      throw new Error("Invalid response from document parser");
    }

    logger.info("LLM parser: Successfully parsed document", {
      duration,
      testCount: parsed.tests.length,
      collectionDate: parsed.collection_date,
      testType: parsed.test_type,
    });

    return parsed;
  } catch (error) {
    logger.error("LLM parser: Error", { error });

    // Re-throw with user-friendly message if needed
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to parse document. Please try again.");
  }
}
