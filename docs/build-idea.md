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

- Upload test results (photo/PDF) or manual entry
- Automatic document parsing to extract key info (dates, results, STIs tested)
- View test history with clear status indicators (Negative/Positive/Pending)

### 2. Secure Sharing

- Generate time-limited shareable links
- Control exactly what information is visible to recipients
- Share via link, QR code, or in-app

### 3. Testing Reminders

- Set personalized testing schedules (3mo/6mo/yearly)
- Push notification reminders
- Track upcoming test dates

### 4. Educational Resources

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
| Notifications | Expo Notifications           |

---

## Key Screens & Routes

### Public (Unauthenticated)

| Screen        | Route           | Description                       |
| ------------- | --------------- | --------------------------------- |
| Landing       | `/`             | App intro, value prop             |
| Login         | `/login`        | Apple Sign-In                     |
| Shared Result | `/share/:token` | Public view of shared test result |

### Protected (Authenticated)

| Screen      | Route          | Description                                   |
| ----------- | -------------- | --------------------------------------------- |
| Dashboard   | `/dashboard`   | Recent results, next test date, quick actions |
| Test Detail | `/results/:id` | Full result view, share options               |
| Upload      | `/upload`      | Camera/file upload flow                       |
| Reminders   | `/reminders`   | Testing schedule management                   |
| Settings    | `/settings`    | Profile, preferences, data management         |

---

## Data Model (High-Level)

### Users

- id, apple_id, display_name, created_at

### Test Results

- id, user_id, test_date, status, sti_type[], file_url, parsed_data, created_at

### Share Links

- id, test_id, token, expires_at, view_count, created_at

### Reminders

- id, user_id, frequency, next_date, is_active

---

## Privacy Principles

- Minimal data collection
- User controls all sharing
- Share links expire automatically
- No identifying info shown on shared views unless user opts in
- Easy data deletion

---

## Development Phases

### Phase 1: Foundation

- Project setup (Expo + NativeWind + Supabase)
- Apple auth flow
- Basic navigation structure

### Phase 2: Core Features

- Test result CRUD
- File upload to Supabase Storage
- Dashboard UI

### Phase 3: Sharing

- Generate shareable links
- Public share page (web)
- QR code generation

### Phase 4: Reminders

- Schedule setup
- Push notifications
- Reminder management

### Phase 5: Polish

- Document parsing/OCR
- Educational content
- Testing & bug fixes

---

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

### Spacing Scale

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

## Known Issues / TODO

### Storage & Files
- [ ] Fix Supabase Storage bucket permissions for file viewing/downloading
- [ ] Implement signed URLs for private file access
- [ ] Add file preview in-app (images) instead of opening in browser

### Features to Complete
- [ ] Share functionality (Phase 3)
- [ ] Push notifications for reminders (Phase 4)
- [ ] Document parsing/OCR (Phase 5)
- [ ] Settings page functionality (profile edit, data export/delete)

---

## Notes for Agent

- Keep components small and focused
- Use TypeScript throughout
- Follow React Native/Expo best practices
- Supabase RLS (Row Level Security) is critical for privacy
- Test on iOS simulator frequently
- Reference Expo docs for native features
