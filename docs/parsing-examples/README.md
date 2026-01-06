# Document Parsing Examples

This directory contains example lab reports for testing the document parser.

## Example Files

### LifeLabs Reports (Sep 2024)
- `lifelabs-sep-24.pdf` - Standard LifeLabs STI panel
- `lifelabs-print-sep-24.pdf` - Printed version
  - Tests: Chlamydia, Gonorrhea, Hepatitis B, Hepatitis C
  - Format: "NEGATIVE", "NOT DETECTED"
  - Date format: "18-SEP-2024"

### Public Health Ontario (Nov 2022)
- `public-health-nov-22-1.jpg` (Page 1)
- `public-health-nov-22-2.jpg` (Page 2)
- `public-health-nov-22-3.jpg` (Page 3)
  - Tests: Hepatitis A, B, C, Herpes 1/2, HIV, Syphilis
  - Format: "Reactive", "Non-Reactive", "Evidence of immunity"
  - Includes interpretation fields
  - Date format: "2022-10-31"

## Testing the Parser

### Prerequisites
1. Set `EXPO_PUBLIC_OPENROUTER_API_KEY` in `.env`:
   ```
   EXPO_PUBLIC_OPENROUTER_API_KEY=your_key_here
   ```

2. Get a free API key from https://openrouter.ai/

### Test Flow
1. Launch the app and navigate to Upload
2. Select one of the example PDFs
3. Tap "Auto-Extract Data"
4. Verify the extracted data matches the report

### Expected Results

**LifeLabs PDF:**
- Collection Date: 2024-09-18
- Test Type: Full STI Panel
- Tests Found: 4 (Chlamydia, Gonorrhea, Hepatitis B, Hepatitis C)
- Overall Status: Negative

**Public Health Images:**
- Collection Date: 2022-10-31
- Test Type: Full STI Panel
- Tests Found: ~10 (HIV, Hepatitis A/B/C, Herpes 1/2, Syphilis)
- Overall Status: Negative (with HSV-1 positive)

## Parser Architecture

```
Document (PDF/Image)
    ↓
extractTextFromPDF() or extractTextFromImage()
    ↓
parseDocumentWithLLM() → OpenRouter (Llama 3.3 70B)
    ↓
normalizeTestName() → Standardize test names
    ↓
standardizeResult() → Map to negative/positive/pending
    ↓
ParsedDocument
```

## Notes

- PDF text extraction is basic (atob decode). For scanned PDFs, add OCR.
- LLM model: `meta-llama/llama-3.3-70b-instruct:free` (0 cost)
- Temperature: 0.1 (deterministic extraction)
- The parser handles both formats automatically without regex patterns.
