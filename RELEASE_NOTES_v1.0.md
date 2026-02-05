# Discloser iOS v1.0.0 Beta

**Build:** 30
**Date:** February 2026
**Platform:** iOS 16.0+

## Features

### Authentication
- Apple Sign-In (primary)
- Google Sign-In
- Magic Link email authentication with deep linking callback

### Onboarding
- Profile setup: name, alias, date of birth
- Known conditions declaration
- Risk assessment questionnaire with personalized risk level (Low/Moderate/High)

### Dashboard
- Aggregated STI status overview
- Routine tests and known conditions displayed separately
- Next testing reminder card
- Risk assessment prompt for new users
- Quick action buttons for upload, sharing, and reminders

### Upload & Parsing
- Multi-file document upload (PDF, images)
- AI-powered test result extraction (OCR + LLM parsing)
- Progress tracking with cancel support
- Retry on parse failures
- Result preview and confirmation before saving
- Manual entry fallback

### Test Results
- Detailed result view per upload
- Individual STI breakdowns with status badges
- Verified/unverified status indicators
- Share directly from result detail screen

### Sharing (Individual Results)
- Time-limited share links (1 hour to 30 days)
- View-limited links (1, 3, 5 views or unlimited)
- QR code generation for in-person sharing
- Display name options: anonymous, alias, or first name
- Recipient preview showing exactly what they'll see
- Copy link to clipboard

### Sharing (Aggregated Status)
- Share overall STI status across all tests
- Option to exclude known/chronic conditions
- Same expiry, view limit, and identity options as individual sharing

### Reminders
- Testing reminder management with configurable frequency
- Overdue reminder alerts
- Calendar integration (add to device calendar)
- Push notification support

### Settings
- Profile editing (name, alias, date of birth)
- Known conditions management
- Theme selection (light, dark, system)
- Account reset and deletion
- Sign out

### Accessibility
- VoiceOver labels on all interactive elements
- Minimum 44pt touch targets
- AccessiblePressable component for consistent behavior
- Dynamic type support

### Theme
- Full dark mode support
- System theme detection
- Consistent styling across all screens

## Known Issues

- Push notifications may be limited in TestFlight builds
- Document parsing works best with clear, high-resolution PDFs
- Google Sign-In is disabled on iOS (Apple Sign-In and Magic Link available)

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
