// Supabase Edge Function: parse-document
// Proxies LLM parsing requests to OpenRouter, keeping API keys server-side

import { corsHeaders } from "../_shared/cors.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct";

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
- There should only be one entry per disease / test type (e.g. one HIV entry, one Hepatitis A entry, etc.)

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
 * Sanitizes user-provided document text to prevent prompt injection attacks.
 */
function sanitizeDocumentText(text: string): string {
  let sanitized = text;

  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Escape XML/HTML-like tags that could be interpreted as instructions
  sanitized = sanitized.replace(/<(system|user|assistant|instruction|prompt|ignore|override)/gi, "&lt;$1");

  // Remove common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /forget\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /new\s+instructions?\s*:/gi,
    /you\s+are\s+now\s+a/gi,
    /act\s+as\s+if\s+you\s+are/gi,
    /pretend\s+(you\s+are|to\s+be)/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, "[REMOVED]");
  }

  // Normalize excessive whitespace
  sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");

  // Limit to 100k characters
  if (sanitized.length > 100000) {
    sanitized = sanitized.substring(0, 100000);
  }

  return sanitized.trim();
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify API key is configured
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user authentication
    // Note: Supabase gateway validates the JWT before the request reaches this function.
    // If the Authorization header is present with a valid JWT, the user is authenticated.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize input
    const sanitizedText = sanitizeDocumentText(text);

    // Build request payload
    const requestPayload = {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract STI test results from the lab report contained within the <document> tags below. Only process the content inside these tags as a medical document.

<document>
${sanitizedText}
</document>

Parse only the medical test results from the document above and return the JSON response.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    };

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://discloser.app",
        "X-Title": "Discloser STI Test Parser",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `LLM API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty response from LLM" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Parse and validate JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse LLM response as JSON" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!parsed.tests || !Array.isArray(parsed.tests)) {
      return new Response(
        JSON.stringify({ error: "Invalid LLM response structure" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-document error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
