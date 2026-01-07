# Discloser - iOS App Rebuild

## Concept

Discloser is a sexual health management app that helps users securely store, track, and share STI test results. The app promotes informed consent and regular testing through privacy-first design.

## Core Problem

Sharing STI test results is awkward and often involves exposing unnecessary personal medical information. People also struggle to maintain consistent testing schedules.

## Target Users

- Sexually active adults managing their sexual health
- People who want to share test status with partners discreetly
- Users who need testing schedule reminders

---

## Core Features

### 1. Test Result Management

- Upload test results (photo from camera/gallery) or manual entry
- AI-powered automatic extraction of test data (dates, results, STIs tested)
- Support for multi-image uploads (e.g., 3-page test results)
- Review and edit extracted results before saving
- View test history with clear status indicators (Negative/Positive/Pending/Inconclusive)
- Quick preset selection for manual entry (Full Panel, Basic Screen, 4-Test Panel, HIV Only)

### 2. Secure Sharing

- Generate time-limited shareable links (1 hour to 30 days)
- Optional view limits (1, 5, 10, or unlimited views)
- Control exactly what information is visible to recipients
- Share via link, QR code, or in-app preview
- Share individual test results OR aggregated STI status

### 3. Testing Reminders

- Set personalized testing schedules (monthly/3mo/6mo/yearly)
- Push notification reminders
- Track upcoming test dates
- Overdue and upcoming alerts on dashboard
- Auto-creates/updates reminders when tests are uploaded (based on risk level)

### 4. Risk Assessment & Recommendations

- 4-question questionnaire based on CDC guidelines
- Calculates risk level (Low/Moderate/High)
- Personalized testing frequency recommendations:
  - Low risk: Test yearly
  - Moderate risk: Test every 6 months
  - High risk: Test every 3 months
- Risk level stored in profile for personalization

### 5. Educational Resources (Planned)

- Verified sexual health information
- Links to local testing locations

---

## Tech Stack

| Layer         | Technology                   |
| ------------- | ---------------------------- |
| Framework     | React Native (Expo)          |
| Styling       | NativeWind (Tailwind for RN) |
| Database      | Supabase (Postgres)          |
| Auth          | Apple Sign-In via Supabase   |
| File Storage  | Supabase Storage             |
| OCR           | Google Cloud Vision API      |
| AI Parsing    | OpenRouter (Llama 3.3 70B)   |
| Notifications | Expo Notifications           |
| Web           | Next.js (share pages)        |
| Deployment    | Vercel (web)                 |

---

## Key Screens & Routes

### Public (Unauthenticated)

| Screen        | Route            | Description                          |
| ------------- | ---------------- | ------------------------------------ |
| Landing       | `/`              | App intro, value prop                |
| Login         | `/login`         | Apple Sign-In                        |
| Shared Result | `/share/:token`  | Public view of shared test result    |
| Shared Status | `/status/:token` | Public view of aggregated STI status |

### Protected (Authenticated)

| Screen      | Route          | Description                                   |
| ----------- | -------------- | --------------------------------------------- |
| Dashboard   | `/dashboard`   | Recent results, next test date, quick actions |
| Test Detail | `/results/:id` | Full result view, share options               |
| Upload      | `/upload`      | Camera/file upload flow with presets          |
| Reminders   | `/reminders`   | Testing schedule management                   |
| Settings    | `/settings`    | Profile, risk assessment, data management     |

---

## Data Model

### Profiles

- id (UUID, references auth.users)
- display_name (text)
- risk_level (enum: low/moderate/high)
- risk_assessed_at (timestamptz)
- created_at, updated_at

### Test Results

- id (UUID)
- user_id (UUID, references auth.users)
- test_date (date)
- status (enum: negative/positive/pending/inconclusive)
- test_type (text)
- sti_results (jsonb array)
- file_url, file_name (text)
- notes (text)
- is_verified (boolean)
- created_at, updated_at

### Share Links (Individual Results)

- id (UUID)
- test_result_id (UUID, references test_results)
- user_id (UUID)
- token (text, unique 64-char hex)
- expires_at (timestamptz)
- view_count (integer)
- max_views (integer, optional)
- show_name (boolean)
- created_at

### Status Share Links (Aggregated Status)

- id (UUID)
- user_id (UUID)
- token (text, unique)
- expires_at (timestamptz)
- view_count, max_views
- show_name (boolean)
- display_name (text, snapshot)
- status_snapshot (jsonb, snapshot of all STI statuses)
- created_at

### Reminders

- id (UUID)
- user_id (UUID)
- title (text)
- frequency (enum: monthly/quarterly/biannual/annual)
- next_date (date)
- is_active (boolean)
- created_at, updated_at

---

## Privacy Principles

- Minimal data collection
- User controls all sharing
- Share links expire automatically
- View limits prevent unlimited access
- No identifying info shown on shared views unless user opts in
- Easy data deletion
- Row Level Security on all tables

---

## Development Phases

### Phase 1: Foundation - COMPLETE

- [x] Project setup (Expo + NativeWind + Supabase)
- [x] Apple auth flow
- [x] Basic navigation structure

### Phase 2: Core Features - COMPLETE

- [x] Test result CRUD
- [x] File upload to Supabase Storage
- [x] Dashboard UI
- [x] AI-powered document parsing

### Phase 3: Sharing - COMPLETE

- [x] Generate shareable links with expiry
- [x] Public share page (web) for individual results
- [x] Public share page (web) for aggregated status
- [x] QR code generation
- [x] View count tracking and limits

### Phase 4: Reminders - COMPLETE

- [x] Schedule setup with frequency options
- [x] Reminder management (create, edit, delete, toggle)
- [x] Overdue/upcoming alerts on dashboard
- [x] Risk-based suggested reminders
- [x] Auto-create reminders on test upload

### Phase 5: Smart Features - COMPLETE

- [x] Risk assessment questionnaire
- [x] Personalized testing recommendations
- [x] Improved manual entry with presets
- [x] Canadian lab verification

### Phase 6: Polish & Production - IN PROGRESS

- [ ] Push notifications (requires development build)
- [ ] Educational resources
- [ ] PDF upload support
- [ ] App Store submission

---

## Styling Guide

### Design Direction

Modern, clean, and approachable. The app should feel trustworthy and calming—not clinical or intimidating. Prioritize whitespace, soft corners, and subtle animations.

### Brand Colors

| Name           | Hex       | Usage                               |
| -------------- | --------- | ----------------------------------- |
| Primary        | `#923D5C` | Main brand color, CTAs, key actions |
| Primary Light  | `#EAC4CE` | Backgrounds, highlights, badges     |
| Primary Dark   | `#7A3350` | Pressed states, emphasis            |
| Secondary      | `#757575` | Muted text, icons                   |
| Secondary Dark | `#43344F` | Deep accent, headers                |
| Success        | `#28A745` | Negative results, confirmations     |
| Success Light  | `#E8F5E9` | Success badges background           |
| Danger         | `#DC3545` | Positive results, alerts            |
| Danger Light   | `#F8D7DA` | Danger badges background            |
| Warning        | `#FFC107` | Pending states                      |
| Warning Light  | `#FFF3CD` | Warning badges background           |
| Background     | `#FFFFFF` | Main background                     |
| Text           | `#374151` | Body text                           |
| Text Light     | `#6B7280` | Secondary text, labels              |
| Border         | `#E0E0E0` | Dividers, card borders              |

### Typography

**Font Family:** Inter (available via Google Fonts / Expo)

| Weight    | Value | Usage                   |
| --------- | ----- | ----------------------- |
| Regular   | 400   | Body text               |
| Medium    | 500   | Labels, subtle emphasis |
| Semi-Bold | 600   | Subheadings, buttons    |
| Bold      | 700   | Headings, key info      |

### Spacing Scale (Tailwind)

Use consistent spacing: `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `10` (40px), `12` (48px)

### Border Radius

- Small elements (badges, chips): `rounded-lg` (8px)
- Cards, inputs: `rounded-xl` (12px)
- Buttons: `rounded-2xl` (16px) or `rounded-full` for pill shapes

### Component Patterns

**Status Badges:**

- Negative (good): Success green bg + text
- Positive (alert): Danger red bg + text
- Pending: Warning yellow bg + text
- Verified: Success green with checkmark

**Cards:**

- White background
- Subtle shadow (`shadow-sm`)
- Rounded corners (`rounded-xl`)
- Comfortable padding (`p-4` or `p-6`)

**Buttons:**

- Primary: Solid primary color, white text
- Secondary: Primary light bg, primary text
- Ghost: Transparent bg, primary text

**Icons:**

- Use Lucide React Native for consistency
- Size: 20-24px for inline, 32px for feature highlights

### Visual Principles

- Generous whitespace
- Soft, rounded corners throughout
- Subtle shadows over hard borders
- Smooth transitions/animations (300ms ease)
- Accessible contrast ratios

---

## Completed Features

### Storage & Files

- [x] Supabase Storage bucket with RLS
- [x] Signed URLs for private file access
- [x] In-app image preview

### Core Functionality

- [x] Share individual results with time-limited links
- [x] Share aggregated STI status across all tests
- [x] Document parsing/OCR (Google Vision + OpenRouter LLM)
- [x] Settings page (profile edit, notifications toggle, data delete)
- [x] Web share pages (`/share/[token]` and `/status/[token]`)
- [x] Document verification (Canadian labs)
- [x] Risk assessment questionnaire
- [x] Testing recommendations based on risk level
- [x] Smart reminders (auto-create on test upload)
- [x] Manual entry presets (Full Panel, Basic Screen, etc.)
- [x] Overdue reminder alerts on dashboard

### Deployment

- [x] Web share pages on Vercel (https://discloser-ios.vercel.app)
- [x] `EXPO_PUBLIC_SHARE_BASE_URL` configured

---

## TODO / Remaining Work

### High Priority

- [ ] Apple Developer Account signup
- [ ] Development build for push notifications (Expo Go limitation)
- [ ] Configure deep linking / iOS Universal Links
- [ ] App Store submission

### Medium Priority

- [ ] PDF upload support (requires PDF-to-image conversion)
- [ ] Educational resources (testing locations, health info)
- [ ] Onboarding flow for new users

### Future Enhancements

- [ ] Intake questionnaire on account creation:
  - Known chronic STI status (HSV/HIV)
  - Medications (PrEP, antivirals)
  - Testing history
  - To personalize reminders and avoid flagging managed conditions
- [ ] Apple Wallet pass for quick status sharing:
  - QR code linking to status page
  - Basic info (last tested date, overall status)
  - Quick tap-to-share at events/clubs/play parties
- [ ] Partner notification features
- [ ] Testing location finder integration
- [ ] Multi-language support

---

## Notes for Agent

- Keep components small and focused
- Use TypeScript throughout
- Follow React Native/Expo best practices
- Supabase RLS (Row Level Security) is critical for privacy
- Test on iOS simulator frequently
- Reference Expo docs for native features
- When adding database changes, update both schema.sql and run in Supabase SQL Editor
