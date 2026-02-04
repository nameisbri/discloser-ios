# PDF Support - Technical Design

## Architecture Overview

This design extends the existing document parsing pipeline to handle PDF files alongside images.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Upload Flow                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────────┐ │
│  │ Image Picker │    │ Document Picker  │    │   File Type Router     │ │
│  │ (existing)   │───►│ (new - PDFs)     │───►│                        │ │
│  └──────────────┘    └──────────────────┘    │  Image? → OCR Pipeline │ │
│                                               │  PDF?   → PDF Pipeline │ │
│                                               └────────────────────────┘ │
│                                                          │               │
│                              ┌────────────────────────────┘               │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      PDF Processing Pipeline                       │  │
│  │                                                                    │  │
│  │  ┌─────────────┐   ┌──────────────────┐   ┌────────────────────┐  │  │
│  │  │ PDF Text    │   │ Text Sufficient? │   │ OCR Fallback       │  │  │
│  │  │ Extraction  │──►│ (>100 chars)     │──►│ (for scanned PDFs) │  │  │
│  │  │ (native)    │   │                  │   │                    │  │  │
│  │  └─────────────┘   │  Yes: Use text   │   │ Convert pages to   │  │  │
│  │                    │  No: Use OCR ────┼──►│ images → OCR each  │  │  │
│  │                    └──────────────────┘   └────────────────────┘  │  │
│  │                              │                      │              │  │
│  │                              ▼                      ▼              │  │
│  │                    ┌────────────────────────────────┐              │  │
│  │                    │      Aggregate Text            │              │  │
│  │                    │   (combine all pages)          │              │  │
│  │                    └────────────────────────────────┘              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                        │                                 │
│                                        ▼                                 │
│                    ┌─────────────────────────────────────┐              │
│                    │         LLM Parser (existing)       │              │
│                    │    meta-llama/llama-3.3-70b-instruct│              │
│                    └─────────────────────────────────────┘              │
│                                        │                                 │
│                                        ▼                                 │
│                    ┌─────────────────────────────────────┐              │
│                    │    Deduplication & Normalization    │              │
│                    │           (existing)                │              │
│                    └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

## New Dependencies

| Package | Purpose | Dev Build Required |
|---------|---------|-------------------|
| `expo-document-picker` | Select PDF files from device | No |
| `expo-pdf-text-extract` | Native text extraction from PDFs | Yes |
| `react-native-pdf-thumbnail` | Convert PDF pages to images (fallback for scanned PDFs) | Yes |

**Note:** The app already uses `expo-dev-client`, so native modules are supported.

**Implementation Note:** Originally planned `react-native-pdf-jsi` but used `react-native-pdf-thumbnail` instead for simpler integration.

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `lib/parsing/pdfParser.ts` | PDF text extraction, OCR fallback, and types |

**Note:** Types are defined in `pdfParser.ts` rather than a separate file.

### Modified Files

| File | Changes |
|------|---------|
| `app/(protected)/upload.tsx` | Add PDF picker option, handle PDF file type |
| `lib/parsing/documentParser.ts` | Route PDFs to new PDF pipeline |
| `lib/parsing/index.ts` | Export new PDF functions |
| `lib/parsing/types.ts` | Add PDF-specific types |
| `app.json` | Add config plugins |
| `package.json` | Add new dependencies |

## Detailed Design

### 1. PDF File Selection

Update `upload.tsx` to use `expo-document-picker` for PDFs:

```typescript
import * as DocumentPicker from 'expo-document-picker';

const pickPDF = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: true,
  });

  if (!result.canceled && result.assets.length > 0) {
    // Filter to respect MAX_FILES_LIMIT
    const pdfFiles = result.assets.slice(0, slotsAvailable).map(asset => ({
      uri: asset.uri,
      name: asset.name || `document_${Date.now()}.pdf`,
      type: 'pdf' as const,
      size: asset.size,
      pageCount: undefined, // Will be determined during processing
    }));
    // ...
  }
};
```

### 2. PDF Text Extraction

New `lib/parsing/pdfParser.ts`:

```typescript
import { extractText, getPageCount } from 'expo-pdf-text-extract';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  extractionMethod: 'native' | 'ocr';
  pageTexts: string[]; // Text per page for multi-page handling
}

/**
 * Minimum characters to consider text extraction successful.
 * Below this threshold, we assume the PDF is scanned/image-based.
 */
const MIN_TEXT_THRESHOLD = 100;

/**
 * Maximum pages to process (prevents excessive API calls)
 */
const MAX_PAGES = 10;

export async function extractTextFromPDF(
  uri: string,
  fileIdentifier?: string
): Promise<PDFExtractionResult> {
  // Get page count
  const pageCount = await getPageCount(uri);
  const pagesToProcess = Math.min(pageCount, MAX_PAGES);

  // Try native text extraction first
  const text = await extractText(uri);

  if (text && text.length >= MIN_TEXT_THRESHOLD) {
    return {
      text,
      pageCount,
      extractionMethod: 'native',
      pageTexts: [text], // Single combined text for native extraction
    };
  }

  // Fallback to OCR for scanned PDFs
  return await extractTextFromPDFViaOCR(uri, pagesToProcess, fileIdentifier);
}
```

### 3. OCR Fallback for Scanned PDFs

```typescript
import PdfThumbnail from 'react-native-pdf-thumbnail';

async function extractTextFromPDFWithOCR(
  uri: string,
  maxPages: number,
  fileIdentifier?: string
): Promise<PDFExtractionResult> {
  // Convert all PDF pages to images at quality 100 for best OCR accuracy
  const thumbnails = await PdfThumbnail.generateAllPages(uri, 100);
  const pagesToProcess = Math.min(thumbnails.length, maxPages);
  const pageTexts: string[] = [];
  let combinedText = '';

  for (let i = 0; i < pagesToProcess; i++) {
    const thumbnail = thumbnails[i];
    // Run OCR on the image (reuse existing function)
    const pageText = await extractTextFromImage(thumbnail.uri, fileIdentifier);
    pageTexts.push(pageText);
    if (pageText.trim()) {
      combinedText += pageText + '\n\n--- Page ' + (i + 1) + ' ---\n\n';
    }
  }

  return {
    text: combinedText.trim(),
    pageCount: thumbnails.length,
    pagesProcessed: pagesToProcess,
    extractionMethod: 'ocr',
    pageTexts,
    success: pageTexts.some(t => t.trim().length > 0),
  };
}
```

### 4. Integration with Document Parser

Update `documentParser.ts`:

```typescript
export async function parseDocument(
  uri: string,
  mimeType: string,
  userProfile?: UserProfileForVerification,
  fileIdentifier?: string
): Promise<ParsedDocument> {
  // Route based on file type
  if (mimeType === 'application/pdf') {
    return parsePDFDocument(uri, userProfile, fileIdentifier);
  }

  // Existing image processing flow
  return parseImageDocument(uri, mimeType, userProfile, fileIdentifier);
}

async function parsePDFDocument(
  uri: string,
  userProfile?: UserProfileForVerification,
  fileIdentifier?: string
): Promise<ParsedDocument> {
  const pdfResult = await extractTextFromPDF(uri, fileIdentifier);

  // Send extracted text to LLM parser (same as image flow)
  const llmResponse = await parseDocumentWithLLM(pdfResult.text);

  // Continue with existing normalization, verification, etc.
  // ...
}
```

### 5. UI Updates

Update `SelectedFile` type:

```typescript
type SelectedFile = {
  uri: string;
  name: string;
  type: 'image' | 'pdf';
  size?: number;
  pageCount?: number; // For PDFs
};
```

Add PDF upload option to the selection screen:

```typescript
<UploadOption
  icon={<FileText size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />}
  title="Upload PDF"
  description="Lab results as PDF document"
  onPress={pickPDF}
  isDark={isDark}
/>
```

### 6. Error Handling

New PDF-specific error types in `DocumentParsingError`:

```typescript
type ParsingErrorType =
  | 'ocr'
  | 'llm_parsing'
  | 'normalization'
  | 'validation'
  | 'network'
  | 'pdf_extraction'  // New
  | 'pdf_too_large'   // New
  | 'pdf_password'    // New
  | 'unknown';
```

Error messages:
- `pdf_extraction`: "Failed to read the PDF file. Please ensure it's not corrupted."
- `pdf_too_large`: "This PDF has too many pages. Please upload a PDF with 10 or fewer pages."
- `pdf_password`: "This PDF is password-protected. Please remove the password and try again."

## Configuration Changes

### app.json

```json
{
  "expo": {
    "plugins": [
      "expo-document-picker"
    ]
  }
}
```

**Note:** `expo-pdf-text-extract` and `react-native-pdf-thumbnail` don't require config plugins.
```

### package.json (new dependencies)

```json
{
  "dependencies": {
    "expo-document-picker": "~14.0.0",
    "expo-pdf-text-extract": "^1.0.0",
    "react-native-pdf-thumbnail": "^1.2.4"
  }
}
```

## Security Considerations

1. **File Validation**: Validate MIME type and file extension before processing
2. **Size Limits**: Enforce 20 MB file size limit and 10 page limit
3. **Temporary Files**: Clean up converted images after processing
4. **No Cloud Storage**: PDFs are processed locally, never uploaded to cloud (matching existing privacy model)

## Performance Considerations

1. **Sequential Processing**: Process pages sequentially to avoid rate limiting
2. **Progress Feedback**: Show per-page progress for multi-page PDFs
3. **Memory Management**: Clean up temporary files after each page
4. **Timeout Handling**: 30-second timeout per page for OCR

## Testing Strategy

1. **Unit Tests**: PDF extraction functions with mock data
2. **Integration Tests**: Full flow from file selection to results
3. **Test PDFs**:
   - Single-page text-based PDF
   - Multi-page text-based PDF
   - Scanned/image-based PDF
   - Mixed content PDF (some pages text, some scanned)
   - Password-protected PDF (should fail gracefully)
   - Large PDF (>10 pages, should process first 10)
   - Empty PDF (should fail gracefully)

---

## Implementation Task Breakdown

> **Status: All phases complete as of Build 29**

### Phase 1: Foundation (Tasks 1-3) ✅

**Task 1: Add PDF dependencies and configuration** ✅
- Install `expo-document-picker`, `expo-pdf-text-extract`
- Update `app.json` with config plugins
- Verify build succeeds with new dependencies
- Acceptance: `npx expo prebuild` succeeds, app builds

**Task 2: Create PDF parser module** ✅
- Create `lib/parsing/pdfParser.ts`
- Implement `extractTextFromPDF()` function
- Add PDF-specific types (in pdfParser.ts)
- Acceptance: Can extract text from a text-based PDF file

**Task 3: Add PDF file picker to upload screen** ✅
- Add "Upload PDF" option to upload selection screen
- Implement `pickPDF()` function using expo-document-picker
- Update `SelectedFile` type to support PDFs
- Display PDF icon and page count in preview
- Acceptance: User can select a PDF file and see it in preview

### Phase 2: Integration (Tasks 4-5) ✅

**Task 4: Integrate PDF parsing with document parser** ✅
- Update `parseDocument()` to route PDFs to PDF pipeline
- Connect PDF text extraction to LLM parser
- Handle PDF-specific errors
- Acceptance: Text-based PDFs are parsed and results displayed

**Task 5: Add multi-page PDF support** ✅
- Process all pages (up to 10)
- Aggregate text across pages
- Update progress UI to show page progress
- Acceptance: Multi-page PDFs process all pages and combine results

### Phase 3: Fallback & Polish (Tasks 6-7) ✅

**Task 6: Add OCR fallback for scanned PDFs** ✅
- Install `react-native-pdf-thumbnail` for page-to-image conversion
- Implement `extractTextFromPDFWithOCR()` fallback
- Auto-detect when to use OCR (text threshold < 50 chars)
- Acceptance: Scanned PDFs are processed via OCR

**Task 7: Error handling and edge cases** ✅
- Handle password-protected PDFs
- Handle corrupted PDFs
- Handle oversized PDFs (>10 pages, >20 MB)
- Add user-friendly error messages
- Acceptance: All error cases show appropriate messages

### Phase 4: Testing (Task 8) ✅

**Task 8: Manual testing and documentation** ✅
- Tested with text-based LifeLabs PDFs
- Tested with scanned Public Health PDFs
- Tested multi-document upload (mixed text + scanned)
- Updated documentation to reflect implementation
