# Discloser iOS v1.0.0 Beta

**Build:** 39
**Date:** February 2026
**Platform:** iOS 16.0+

## Features

### Authentication
- Apple Sign-In (primary, iOS)
- Magic Link email authentication with deep linking callback
- Session persistence across app restarts with automatic token refresh

### Onboarding
- Profile setup: first name, last name, alias, date of birth, pronouns
- Known conditions declaration with per-condition management methods
- Risk assessment questionnaire with personalized risk level (Low / Moderate / High)

### Dashboard
- Time-based greeting (Good morning / afternoon / evening)
- "All clear" status pill when all routine tests are negative
- Current status card with latest test result summary
- Managed conditions card with management method pills
- Next testing reminder card with overdue / due soon alerts
- Test history with expandable "View All"
- Pull-to-refresh and skeleton loading states
- Quick actions: upload, share status, view reminders

### Upload & Parsing
- Multi-file document upload (up to 4 files, PDF + images)
- AI-powered test result extraction (Google Cloud Vision OCR + LLM parsing)
- Multi-signal verification scoring with confidence levels:
  - **High confidence** — lab recognized, health card detected, accession number, name match
  - **Verified** — multiple verification signals present
  - **Unverified** — no recognizable lab signals
- Verification details display (lab name, patient name, health card, accession number)
- Duplicate detection (exact content hash + SimHash near-duplicate)
- Per-file retry on parse failure with cancel support
- Progress tracking (uploading, extracting, parsing stages)
- Date, test type, status, and notes editing before save
- Automatic known condition detection (positive status STIs auto-added)
- Automatic reminder update on new result upload

### Test Results
- Detailed result view with individual STI breakdowns and status badges
- Verification badge and confidence level display
- "Managed" badge on STIs matching known conditions
- Management method pills (lavender) for managed conditions
- Notes display, medical disclaimer, delete with confirmation
- Share directly from result detail screen

### Sharing (Individual Results)
- Time-limited share links (1 hour, 24 hours, 7 days, 30 days)
- View-limited links (unlimited, 1, 5, or 10 views)
- Display name options: anonymous, alias, or first name
- Optional label and note (up to 500 characters) per link
- QR code generation for in-person sharing
- Recipient preview showing exactly what they'll see
- Copy link to clipboard
- Known conditions and management methods visible to recipient

### Sharing (Aggregated Status)
- Share overall STI status snapshot across all latest tests
- Option to hide chronic / managed conditions from snapshot
- Same expiry, view limit, label, and identity options as individual sharing
- Status snapshot is frozen at creation time

### Shared Links Management
- Centralized screen for all share links (Settings > Shared Links)
- Filter by type: All, Status, Results
- Active links show label, expiry countdown, view count, name visibility badge
- Expired links shown with lower opacity
- Actions per link: copy, QR code, delete
- Create new status link directly from management screen

### Reminders
- Testing reminder with configurable frequency (monthly, 3 months, 6 months, yearly)
- Next checkup date calculation based on risk level and last test
- Overdue and due soon alerts on dashboard
- Calendar integration (add to device calendar)
- Edit and delete reminders

### Resources
- Sexual health resources organized by region (National, Ontario) and category (Find Testing, Learn More, Get Support)
- Phone and web links with analytics tracking

### Settings
- Profile editing (first name, last name, alias, date of birth, pronouns)
- Name change triggers re-verification of existing results
- Theme selection (dark, light, system)
- Risk assessment quiz with saved result
- Known conditions and management methods management
- Shared links management
- Delete All Data (full account reset to onboarding)
- Sign out with confirmation

### Accessibility
- VoiceOver labels on all interactive elements
- Minimum 44pt touch targets
- AccessiblePressable component for consistent behavior
- Dynamic Type support
- Haptic feedback (light taps, impact transitions, notification alerts)

### Theme
- Full dark mode support with distinct color palette
- System theme detection
- Consistent styling across all screens

## Known Issues

- Push notifications may have limited functionality in TestFlight builds
- Document parsing works best with clear, high-resolution PDFs and images
- Google Sign-In is available on Android only; iOS uses Apple Sign-In and Magic Link

## Device Support

- iPhone 8 and later
- iPad (portrait orientation)
- iOS 16.0 and later

## How to Report Bugs

Please include:
1. What you did (steps to reproduce)
2. What happened (the bug or error)
3. What you expected to happen
4. Screenshot or screen recording (if applicable)
5. Device model and iOS version

Send bug reports to: hello@discloser.app

## TestFlight Notes

- Full functionality requires an internet connection
- Share links open in the recipient's browser at discloser.app
- First launch may take a moment to initialize
