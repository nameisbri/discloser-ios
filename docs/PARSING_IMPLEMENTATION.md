# Document Parsing Implementation

## Overview

Clean LLM-based document parser built from scratch using OpenRouter's free Llama 3.3 70B model. Automatically extracts STI test results from lab reports (PDFs and images).

## Architecture

```
lib/parsing/
├── types.ts                  # TypeScript interfaces
├── llmParser.ts              # OpenRouter API integration
├── testNormalizer.ts         # Test name standardization
├── resultStandardizer.ts     # Result status mapping
├── documentParser.ts         # Main orchestration
└── index.ts                  # Barrel exports
```

## How It Works

### 1. Text Extraction
- **PDFs**: Basic base64 decode (works for text-based PDFs)
- **Images**: Placeholder for OCR (requires Google Cloud Vision or similar)

### 2. LLM Parsing
- **Model**: `meta-llama/llama-3.3-70b-instruct:free`
- **Cost**: $0 (free tier)
- **Temperature**: 0.1 (deterministic)
- **Prompt**: Structured extraction with JSON schema
- **Output**: Collection date, specimen source, test results

### 3. Normalization
**Test Names** (`testNormalizer.ts`):
- Maps lab-specific names to standard names
- Examples:
  - "HIV1/2 AG/AB COMBO SCREEN" → "HIV-1/2"
  - "NEISSERIA GONORRHOEAE DNA" → "Gonorrhea"
  - "CHLAMYDIA TRACHOMATIS" → "Chlamydia"

**Results** (`resultStandardizer.ts`):
- Maps varied result text to status enum
- Patterns:
  - "Negative", "Non-Reactive", "Not Detected" → `negative`
  - "Positive", "Reactive", "Detected" → `positive`
  - "Evidence of immunity" → `negative` (good)
  - Numeric values → `pending` (needs review)

### 4. Integration
**Upload Flow** (`app/(protected)/upload.tsx`):
1. User selects PDF/image
2. "Auto-Extract Data" button appears
3. Parser runs on first file
4. Form auto-fills with extracted data
5. User reviews and adjusts if needed

## Lab Format Support

### LifeLabs (Canada)
- Date: "18-SEP-2024"
- Results: "NEGATIVE", "NOT DETECTED"
- Tests: Chlamydia, Gonorrhea, Hepatitis B/C

### Public Health Ontario
- Date: "2022-10-31"
- Results: "Reactive", "Non-Reactive", "Evidence of immunity"
- Includes interpretation fields
- Tests: Full panel (HIV, Hepatitis A/B/C, Herpes, Syphilis)

**Key Advantage**: LLM handles both formats (and new ones) without regex patterns.

## Setup

### 1. Get OpenRouter API Key
1. Go to https://openrouter.ai/
2. Sign up (free)
3. Generate API key

### 2. Configure Environment
```bash
# .env
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### 3. Test
```bash
npm start
# Navigate to Upload → Select example PDF → Auto-Extract
```

## Example Output

**Input**: LifeLabs PDF (Sep 2024)

**Parsed**:
```typescript
{
  collectionDate: "2024-09-18",
  testType: "Full STI Panel",
  tests: [
    { name: "Chlamydia", result: "NEGATIVE", status: "negative" },
    { name: "Gonorrhea", result: "NEGATIVE", status: "negative" },
    { name: "Hepatitis B", result: "NOT DETECTED", status: "negative" },
    { name: "Hepatitis C", result: "NOT DETECTED", status: "negative" }
  ]
}
```

## Limitations & Future Improvements

### Current Limitations
1. **PDF Extraction**: Only works for text-based PDFs
   - Scanned PDFs need OCR
2. **Image Parsing**: Not yet implemented
   - Needs Google Cloud Vision API integration
3. **Single File**: Only parses first file in multi-file uploads

### Recommended Improvements
1. **Add OCR**:
   ```typescript
   // In documentParser.ts
   async function extractTextFromImage(uri: string): Promise<string> {
     const base64 = await FileSystem.readAsStringAsync(uri, {
       encoding: FileSystem.EncodingType.Base64,
     });

     const response = await fetch(
       `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
       {
         method: 'POST',
         body: JSON.stringify({
           requests: [{
             image: { content: base64 },
             features: [{ type: 'TEXT_DETECTION' }]
           }]
         })
       }
     );

     const data = await response.json();
     return data.responses[0]?.fullTextAnnotation?.text || '';
   }
   ```

2. **Better PDF Parsing**:
   - Use `react-native-pdf` or cloud service (e.g., AWS Textract)

3. **Parse All Files**:
   - Loop through `selectedFiles` and merge results

4. **Confidence Scores**:
   - Ask LLM to provide confidence ratings
   - Flag low-confidence extractions for user review

5. **Validation**:
   - Check for common errors (e.g., future dates)
   - Validate test name spelling
   - Warn if results seem contradictory

## Cost Analysis

**Current Setup**:
- Model: Llama 3.3 70B (free tier on OpenRouter)
- Cost per parse: $0
- Rate limit: ~20 requests/minute (free tier)

**If Scaling**:
- Consider Claude 3 Haiku: ~$0.25/1M input tokens (~$0.001/document)
- Or GPT-4o-mini: Similar pricing
- Both would provide higher accuracy

## Testing

Example documents in `docs/parsing-examples/`:
- `lifelabs-sep-24.pdf` - LifeLabs format
- `public-health-nov-22-*.jpg` - Public Health format

See `docs/parsing-examples/README.md` for test instructions.

## Migration from Old Implementation

**Removed**:
- `stiTestUtils.js` - 400+ lines of regex patterns
- Brittle regex matching
- Lab-specific pattern maintenance

**Replaced With**:
- LLM-based extraction (~100 lines)
- Automatic format adaptation
- Test name normalization (~80 lines)

**Benefits**:
- 80% less code
- Handles new lab formats automatically
- More maintainable
- Better error handling

## API Reference

### `parseDocument(uri: string, mimeType: string): Promise<ParsedDocument>`

Main entry point for document parsing.

**Parameters**:
- `uri`: File URI (local or remote)
- `mimeType`: `"application/pdf"` or `"image/*"`

**Returns**:
```typescript
{
  collectionDate: string | null;  // YYYY-MM-DD
  testType: string;                // e.g., "Full STI Panel"
  tests: ParsedTest[];             // Array of test results
  rawText?: string;                // First 500 chars (debug)
}
```

**Throws**:
- `Error` if file can't be read
- `Error` if LLM parsing fails
- `Error` if OpenRouter API key missing

### `normalizeTestName(testName: string): string`

Standardizes lab-specific test names.

**Example**:
```typescript
normalizeTestName("HIV1/2 AG/AB COMBO SCREEN") // "HIV-1/2"
normalizeTestName("NEISSERIA GONORRHOEAE") // "Gonorrhea"
```

### `standardizeResult(result: string): TestStatus`

Maps result text to status enum.

**Example**:
```typescript
standardizeResult("NEGATIVE") // "negative"
standardizeResult("Non-Reactive") // "negative"
standardizeResult("Evidence of immunity") // "negative"
standardizeResult("Reactive") // "positive"
```

## Debugging

**Enable Logging**:
```typescript
// In llmParser.ts
console.log('LLM Request:', {
  model: MODEL,
  temperature: 0.1,
  textLength: text.length
});

console.log('LLM Response:', parsed);
```

**Common Issues**:

1. **"OpenRouter API error: 401"**
   - Check API key in `.env`
   - Verify key is active

2. **"Unable to extract text from PDF"**
   - PDF is scanned (image-based)
   - Use OCR or manual entry

3. **"Invalid LLM response structure"**
   - LLM returned non-JSON
   - Check OpenRouter status
   - Try again (LLMs can be inconsistent)

4. **Wrong test names**
   - Add mapping to `testNormalizer.ts`
   - Example: `"NEW_TEST_NAME": "Standardized Name"`

## Contributing

When adding support for new lab formats:

1. Add example document to `docs/parsing-examples/`
2. Test with current parser
3. If LLM fails, adjust system prompt in `llmParser.ts`
4. Add new test name mappings to `testNormalizer.ts`
5. Update result patterns in `resultStandardizer.ts` if needed

The LLM should handle most formats automatically without code changes.
