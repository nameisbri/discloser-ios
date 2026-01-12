# Discloser

A mobile app for managing and sharing STI test results securely.

## Features

- **Upload Test Results** - Scan documents with AI-powered extraction (Google Cloud Vision OCR + LLM parsing)
- **Document Verification** - Automatic verification for recognized Canadian labs (LifeLabs, Public Health Ontario, etc.)
- **Track History** - View all your test results in one place
- **Share Securely** - Generate time-limited links or QR codes to share results
- **Share Status** - Share your aggregated STI status across all tests
- **Risk Assessment** - 4-question questionnaire based on CDC guidelines to calculate your risk level
- **Testing Recommendations** - Personalized testing frequency recommendations based on risk level (Low: yearly, Moderate: 6 months, High: 3 months)
- **Known Conditions** - Track chronic STI conditions (HIV, Herpes, Hepatitis B/C) in your profile
- **Reminders** - Set recurring reminders for regular testing with push notifications
- **Onboarding Flow** - Guided setup for new users (profile info, known conditions, risk assessment)
- **Dark Mode** - Toggle between light, dark, or system preference
- **Privacy First** - Your data stays private with row-level security

## Tech Stack

- **Framework**: React Native with Expo (SDK 54)
- **Styling**: NativeWind (Tailwind CSS)
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Document Parsing**: Google Cloud Vision + OpenRouter LLM
- **Notifications**: expo-notifications

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase project

### Environment Variables

Create a `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
EXPO_PUBLIC_SHARE_BASE_URL=https://your-share-domain.com
```

### Database Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to create:
- Tables: `profiles`, `test_results`, `reminders`, `share_links`, `status_share_links`
- Storage bucket: `test-documents`
- RLS policies and helper functions
- Database functions: `get_shared_result()`, `get_shared_status()`, `increment_share_view()`

### Apple Sign-In Setup

The app uses Apple Sign-In for authentication. To enable it:

#### 1. Apple Developer Account Setup

1. **Create App ID**:
   - Go to [Apple Developer Portal](https://developer.apple.com) > Certificates, Identifiers & Profiles > Identifiers
   - Create a new App ID with bundle identifier: `com.discloser-ios.app`
   - Enable "Sign in with Apple" capability

2. **Create Service ID**:
   - Create a new Service ID (e.g., `com.discloser-ios.app.service`)
   - Enable "Sign in with Apple"
   - Configure domains and redirect URLs:
     - Domain: `<your-project-id>.supabase.co`
     - Redirect URL: `https://<your-project-id>.supabase.co/auth/v1/callback`

3. **Create Private Key**:
   - Go to Keys section
   - Create a new key with "Sign in with Apple" capability
   - Download the `.p8` file (you can only download it once!)
   - Note the Key ID

4. **Get Team ID**:
   - Find your Team ID in the membership section

#### 2. Generate Client Secret

Apple requires a JWT client secret. You can generate it using:
- [Supabase's JWT generator](https://supabase.com/docs/guides/auth/social-login/auth-apple#generate-a-client-secret)
- Or use a script/library to generate the JWT with your Team ID, Service ID, Key ID, and private key

**Important**: The client secret expires every 6 months and must be regenerated.

#### 3. Configure Supabase

1. Go to your Supabase project dashboard > Authentication > Providers
2. Enable the Apple provider
3. Enter:
   - **Client ID**: Your Service ID (e.g., `com.discloser-ios.app.service`)
   - **Client Secret**: The generated JWT
4. Save the configuration

#### 4. Verify App Configuration

The app is already configured with:
- ✅ `expo-apple-authentication` package installed
- ✅ Plugin configured in `app.json`
- ✅ `usesAppleSignIn: true` in iOS config
- ✅ Bundle identifier: `com.discloser-ios.app`

**Note**: For development builds, you can use the "Skip Login" option which uses anonymous authentication (must be enabled in Supabase Auth settings).

### Installation

```bash
npm install
npx expo start
```

### Development Build (for push notifications)

```bash
npx expo prebuild
npx expo run:ios
```

## Project Structure

```
app/                    # Expo Router screens
  (auth)/              # Login/signup screens
  (onboarding)/        # Onboarding flow for new users
  (protected)/         # Authenticated screens
    dashboard.tsx      # Main dashboard with recent results
    upload.tsx         # Test result upload flow
    results/[id].tsx   # Individual test result detail
    reminders.tsx      # Testing reminder management
    settings.tsx       # Profile, risk assessment, known conditions
components/            # Reusable UI components
  Badge.tsx           # Status badges
  Button.tsx          # Button component
  Card.tsx            # Card container
  KnownConditionsModal.tsx  # Manage known conditions
  RiskAssessment.tsx  # Risk assessment questionnaire
  ShareModal.tsx      # Share individual results
  StatusShareModal.tsx # Share aggregated status
  SharedResultPreview.tsx  # Preview shared results
context/               # React contexts
  auth.tsx            # Authentication context
  theme.tsx           # Theme (light/dark) context
lib/
  hooks/              # React hooks for data fetching
    useProfile.ts     # User profile management
    useTestResults.ts # Test results CRUD
    useReminders.ts   # Reminder management
    useShareLinks.ts  # Share link generation
    useSTIStatus.ts   # Aggregated STI status
    useTestingRecommendations.ts  # Personalized recommendations
  parsing/            # Document OCR and LLM parsing
    documentParser.ts    # Main parsing orchestrator
    llmParser.ts         # LLM-based extraction
    testNormalizer.ts    # Normalize STI names
    resultStandardizer.ts # Standardize results
  supabase.ts         # Supabase client
  storage.ts           # File upload helpers
  notifications.ts    # Push notification helpers
  types.ts            # TypeScript types
  utils/              # Utility functions
    date.ts           # Date formatting
    stiMatching.ts    # STI name matching
supabase/             # Database schema and migrations
  schema.sql          # Main database schema
  migrations/        # Database migrations
web/                  # Next.js web app for share pages
  app/
    page.tsx          # Landing page with waitlist
    share/[token]/    # Individual test result share page
    status/[token]/   # Aggregated status share page
    test/             # Test/demo page
    api/waitlist/     # Waitlist signup endpoint
```

## Web Share Pages

**Live at:** https://discloser.app

The `web/` directory contains a Next.js app with:

- `/` - Landing page with waitlist signup
- `/share/[token]` - Individual test result share page
- `/status/[token]` - Aggregated STI status share page
- `/test` - Demo/test page for status display

### Local Development

```bash
cd web
cp .env.example .env  # Add Supabase credentials
npm install
npm run dev
```

### Deployment

Deployed to Vercel. Auto-deploys on push to `main`.

## License

Private - All rights reserved
