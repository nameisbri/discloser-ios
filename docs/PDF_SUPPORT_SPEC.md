# PDF Upload Support - Product Specification

## Overview

Enable users to upload PDF documents containing STI test results, with support for multi-page PDFs. This extends the existing image upload functionality to handle the common case where lab results are delivered as PDF files.

## Business Value

- **Increased accessibility**: Many labs provide results as PDFs via patient portals
- **Better user experience**: Users won't need to screenshot/convert PDFs to images first
- **Higher accuracy**: Direct PDF text extraction may be more accurate than OCR on screenshots
- **Reduced friction**: One less step in the upload workflow

## User Stories

### US-1: Upload Single-Page PDF
**As a** user with a PDF test result
**I want to** upload the PDF directly
**So that** I don't have to convert it to an image first

**Acceptance Criteria:**
- [ ] User can select PDF files from device storage
- [ ] PDF is processed and test results are extracted
- [ ] Results are displayed for review before saving
- [ ] Error message shown if PDF cannot be processed

### US-2: Upload Multi-Page PDF
**As a** user with a multi-page PDF test result
**I want to** upload the entire PDF
**So that** all test results across pages are captured

**Acceptance Criteria:**
- [ ] All pages of the PDF are processed (up to reasonable limit)
- [ ] Results from all pages are aggregated and deduplicated
- [ ] User sees combined results from all pages
- [ ] Progress indicator shows multi-page processing status

### US-3: Mixed Upload (Images + PDFs)
**As a** user
**I want to** upload a combination of images and PDFs in one session
**So that** I can capture all my results regardless of format

**Acceptance Criteria:**
- [ ] File picker allows selection of both images and PDFs
- [ ] Each file type is processed appropriately
- [ ] Results are combined and deduplicated across all files

## Functional Requirements

### FR-1: PDF File Selection
- Support PDF file selection via document picker
- Accept `.pdf` file extension and `application/pdf` MIME type
- Maintain existing image selection functionality
- Display appropriate file type icon in preview

### FR-2: PDF Processing
- Extract text directly from PDF when available (text-based PDFs)
- Convert PDF pages to images for OCR when text extraction fails (scanned PDFs)
- Support PDFs up to 10 pages (lab results rarely exceed this)
- Process pages sequentially to avoid rate limiting

### FR-3: Multi-Page Handling
- Extract and process each page independently
- Aggregate results from all pages
- Use existing deduplication logic to merge overlapping results
- Show page count in processing status

### FR-4: Error Handling
- Graceful degradation: if one page fails, continue with others
- Clear error messages for:
  - Corrupted/invalid PDF files
  - Password-protected PDFs (not supported)
  - PDFs with no extractable content
  - PDFs exceeding page limit

## Non-Functional Requirements

### NFR-1: Performance
- Single-page PDF processing should complete within 30 seconds
- Multi-page PDFs: ~15-20 seconds per page (sequential processing)
- Show progress indicator during processing

### NFR-2: File Size Limits
- Maximum PDF file size: 20 MB
- Maximum pages per PDF: 10
- Maximum total files per upload: 4 (existing limit)

### NFR-3: Compatibility
- iOS 14+ (Expo SDK 54 minimum)
- Support both text-based and scanned/image-based PDFs

## Edge Cases & Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Password-protected PDF | Show error: "This PDF is password-protected. Please remove the password and try again." |
| Corrupted PDF | Show error: "Unable to read this PDF. The file may be corrupted." |
| PDF with no text/images | Show error: "No readable content found in this PDF." |
| PDF > 10 pages | Process first 10 pages, show warning: "Only the first 10 pages were processed." |
| PDF > 20 MB | Show error: "This PDF is too large. Please use a smaller file (max 20 MB)." |
| Mixed results across pages | Deduplicate using existing logic, flag conflicts for user review |
| Network failure mid-processing | Allow retry for failed pages (existing retry mechanism) |
| Empty page in multi-page PDF | Skip silently, continue with other pages |

## UI/UX Changes

### Upload Selection Screen
- Add new option: "Choose from files" (or update existing "Choose from photos" to include PDFs)
- Use appropriate icon (document icon vs image icon)

### File Preview Screen
- Show PDF icon for PDF files
- Display page count: "3 pages"
- Show file size

### Processing Screen
- Update message: "Processing page 2 of 5..."
- Show overall progress for multi-page PDFs

## Out of Scope (Post-MVP)

- PDF annotation/highlighting
- Selective page processing (process all pages)
- PDF preview/viewer within app
- Cloud storage integration (Google Drive, iCloud)
- ZIP file support

## Success Metrics

- PDF uploads account for >20% of total uploads within 30 days
- Error rate for PDF processing <5%
- No increase in average processing time complaints
- User satisfaction maintained or improved

## Dependencies

- PDF processing library (to be determined in technical design)
- Existing OCR infrastructure (Google Cloud Vision)
- Existing LLM parsing infrastructure (OpenRouter)

## Timeline Estimate

This is a high-priority pre-launch feature. Implementation should be broken into small, testable tasks.
