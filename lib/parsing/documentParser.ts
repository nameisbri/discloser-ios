// Document parsing pipeline: OCR text → LLM extraction → normalization

import * as FileSystem from "expo-file-system";
import { normalizeTestName } from "./testNormalizer";
import { standardizeResult, determineOverallStatus } from "./resultStandardizer";
import type { STIResult, TestStatus } from "../types";

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const VISION_API = "https://vision.googleapis.com/v1/images:annotate";

// Free model - swap for paid if needed
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

type LLMTest = {
  name: string;
  result: string;
  date?: string;
};

type LLMResponse = {
  provider?: string;
  collection_date?: string;
  tests: LLMTest[];
};

export type ParsedDocument = {
  testDate: string;
  testType: string;
  overallStatus: TestStatus;
  stiResults: STIResult[];
  providerName?: string;
  confidence: number;
};

const SYSTEM_PROMPT = `You extract STI test results from lab reports. Return ONLY valid JSON.

Schema:
{
  "provider": "lab name if visible",
  "collection_date": "YYYY-MM-DD",
  "tests": [
    {"name": "test name", "result": "exact result text"}
  ]
}

Rules:
- Extract ALL tests found
- Keep exact result text (Non-Reactive, NEGATIVE, etc.)
- Use YYYY-MM-DD for dates
- If no date found, use null`;

export async function parseDocument(ocrText: string): Promise<ParsedDocument | null> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("Missing EXPO_PUBLIC_OPENROUTER_API_KEY");
    return null;
  }

  try {
    const response = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://discloser.app",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extract tests from:\n\n${ocrText}` },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("Empty response");

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed: LLMResponse = JSON.parse(jsonMatch[0]);
    
    return processLLMResponse(parsed);
  } catch (error) {
    console.error("Parse error:", error);
    return null;
  }
}

function processLLMResponse(llm: LLMResponse): ParsedDocument {
  const stiResults: STIResult[] = llm.tests.map((test) => {
    const normalized = normalizeTestName(test.name);
    const { status, displayText } = standardizeResult(test.result);
    
    return {
      name: normalized,
      result: displayText,
      status,
    };
  });

  const statuses = stiResults.map((r) => r.status);
  const overallStatus = determineOverallStatus(statuses);

  // Determine test type from tests found
  const testType = stiResults.length > 3 
    ? "Full STI Panel" 
    : stiResults.map(r => r.name).join(", ");

  return {
    testDate: llm.collection_date || new Date().toISOString().split("T")[0],
    testType,
    overallStatus,
    stiResults,
    providerName: llm.provider,
    confidence: stiResults.length > 0 ? 0.85 : 0.5,
  };
}

// Fallback regex extraction if LLM fails
export function extractWithRegex(text: string): Partial<ParsedDocument> | null {
  const dateMatch = text.match(
    /(?:Collection Date|DATE OF COLLECTION|Date Collected)[:\s]*(\d{2}[-/][A-Z]{3}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})/i
  );
  
  const results: STIResult[] = [];
  
  const patterns = [
    { regex: /CHLAMYDIA[^]*?(NEGATIVE|POSITIVE|Non-Reactive)/i, name: "Chlamydia" },
    { regex: /GONORRHOEAE[^]*?(NEGATIVE|POSITIVE|Non-Reactive)/i, name: "Gonorrhea" },
    { regex: /HIV[^]*?(NEGATIVE|POSITIVE|Non-Reactive|NOT DETECTED)/i, name: "HIV-1/2" },
    { regex: /Hepatitis B Surface[^]*?(NEGATIVE|POSITIVE|Non-Reactive|NOT DETECTED)/i, name: "Hepatitis B" },
    { regex: /Hepatitis C[^]*?(NEGATIVE|POSITIVE|Non-Reactive|NOT DETECTED)/i, name: "Hepatitis C" },
    { regex: /Syphilis[^]*?(NEGATIVE|POSITIVE|Non-Reactive)/i, name: "Syphilis" },
  ];

  for (const { regex, name } of patterns) {
    const match = text.match(regex);
    if (match) {
      const { status, displayText } = standardizeResult(match[1]);
      results.push({ name, result: displayText, status });
    }
  }

  if (results.length === 0) return null;

  return {
    testDate: dateMatch?.[1] || new Date().toISOString().split("T")[0],
    stiResults: results,
    overallStatus: determineOverallStatus(results.map(r => r.status)),
  };
}

// OCR via Google Cloud Vision API
export async function extractTextFromImage(imageUri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    console.warn("No EXPO_PUBLIC_GOOGLE_VISION_API_KEY - skipping OCR");
    return "";
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(`${VISION_API}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
        }],
      }),
    });

    const data = await response.json();
    return data.responses?.[0]?.fullTextAnnotation?.text || "";
  } catch (error) {
    console.error("OCR error:", error);
    return "";
  }
}

