// LLM-based document parser using OpenRouter

import { LLMResponse } from './types';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.3-70b-instruct:free'; // Fast and free

const SYSTEM_PROMPT = `You are a medical document parser that extracts STI test results from lab reports.

Your task is to extract:
1. Collection date (when the sample was collected)
2. Specimen source (e.g., "Urine", "Whole blood")
3. All STI test results with their exact result text

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown, no explanation
- Extract the EXACT result text as written in the report
- Include interpretation fields if present
- For numeric results, include the value with units
- If a date is not found, use null
- Group related tests (e.g., "Hepatitis B Surface Antigen" + "Hepatitis B Virus Interpretation")

Example output format:
{
  "collection_date": "2024-09-18",
  "specimen_source": "Urine",
  "tests": [
    {
      "name": "Chlamydia trachomatis DNA (NAAT)",
      "result": "NEGATIVE",
      "notes": "A negative result indicates that nucleic acids from the target pathogen is absent or below the detection limit of the assay."
    },
    {
      "name": "Hepatitis B Surface Antigen",
      "result": "NOT DETECTED"
    },
    {
      "name": "HIV Final Interpretation",
      "result": "No HIV (p24 antigen and/or HIV1/2 antibodies detected)"
    }
  ]
}`;

export async function parseDocumentWithLLM(text: string): Promise<LLMResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('EXPO_PUBLIC_OPENROUTER_API_KEY is not configured');
  }

  // Limit text to ~100k chars (roughly 25k tokens) to avoid context limits
  const truncatedText = text.length > 100000 ? text.substring(0, 100000) : text;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://discloser.app',
        'X-Title': 'Discloser STI Test Parser',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in LLM response');
    }

    // Strip markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Parse the JSON response
    const parsed = JSON.parse(jsonText);

    // Validate response structure
    if (!parsed.tests || !Array.isArray(parsed.tests)) {
      throw new Error('Invalid LLM response structure');
    }

    return parsed;
  } catch (error) {
    console.error('LLM parsing error:', error);
    throw error;
  }
}
