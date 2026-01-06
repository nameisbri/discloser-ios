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

## Notes for Agent

- Keep components small and focused
- Use TypeScript throughout
- Follow React Native/Expo best practices
- Supabase RLS (Row Level Security) is critical for privacy
- Test on iOS simulator frequently
- Reference Expo docs for native features
