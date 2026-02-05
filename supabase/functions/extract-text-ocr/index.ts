// Supabase Edge Function: extract-text-ocr
// Proxies OCR requests to Google Cloud Vision, keeping API keys server-side

import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_VISION_API_KEY = Deno.env.get("GOOGLE_VISION_API_KEY");
const GOOGLE_VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify API key is configured
    if (!GOOGLE_VISION_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Vision API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: Supabase gateway validates the JWT before the request reaches this function.
    // The function has "verify_jwt" enabled by default, so if we reach this point, the user is authenticated.

    // Parse request body
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'imageBase64' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate base64 size (max 20MB for Google Vision)
    const estimatedBytes = imageBase64.length * 0.75;
    if (estimatedBytes > 20 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum size is 20MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Google Vision API
    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Vision API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OCR API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.responses?.[0]?.fullTextAnnotation?.text;

    if (!text || text.length < 20) {
      return new Response(
        JSON.stringify({
          error: "No readable text found in image",
          textLength: text?.length || 0,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ text, textLength: text.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-text-ocr error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
