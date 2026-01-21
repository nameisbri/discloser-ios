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
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Document Parsing
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key

# Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id

# Share Links
EXPO_PUBLIC_SHARE_BASE_URL=https://your-share-domain.com
```

### Database Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to create:
- Tables: `profiles`, `test_results`, `reminders`, `share_links`, `status_share_links`
- Storage bucket: `test-documents`
- RLS policies and helper functions
- Database functions: `get_shared_result()`, `get_shared_status()`, `increment_share_view()`

### Authentication Setup

The app supports multiple authentication methods:

**iOS:** Apple Sign-In, Google Sign-In, Magic Link (email)
**Android:** Google Sign-In, Magic Link (email)

#### Apple Sign-In Setup (iOS only)

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

#### Google Sign-In Setup (iOS + Android)

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing

2. **Enable Google Sign-In API**:
   - Navigate to APIs & Services > Library
   - Search for "Google Sign-In API" and enable it

3. **Create OAuth Consent Screen**:
   - Go to APIs & Services > OAuth consent screen
   - Configure app information (required for production)
   - For testing, you can use "External" user type

4. **Create OAuth 2.0 Credentials**:

   **Web Client ID (for Supabase)**:
   - Go to APIs & Services > Credentials
   - Create Credentials > OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://<your-project-id>.supabase.co/auth/v1/callback`
   - Copy the **Web Client ID** to your `.env` file

   **iOS Client ID (optional, for native Google Sign-In)**:
   - Create OAuth client ID
   - Application type: iOS
   - Bundle ID: `com.discloser-ios.app`
   - Copy the **iOS Client ID**

   **Android Client ID (for native Google Sign-In)**:
   - Create OAuth client ID
   - Application type: Android
   - Package name: `com.discloser.app` (or your Android package)
   - SHA-1 fingerprint: Get from your signing keystore
   - Copy the **Android Client ID**

5. **Configure Supabase**:
   - Go to your Supabase project dashboard > Authentication > Providers
   - Enable Google provider
   - Enter:
     - **Client ID**: Your Web Client ID
     - **Client Secret**: Your Web Client Secret
   - Save configuration

The app is already configured with:
- ✅ `@react-native-google-signin/google-signin` package installed
- ✅ iOS: Uses Supabase OAuth flow with browser (`expo-web-browser`)
- ✅ Android: Uses native Google Sign-In with credential manager
- ✅ Environment variable: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

#### Magic Link Setup (Email-Based Passwordless Auth)

1. **Configure Supabase**:
   - Go to your Supabase project dashboard > Authentication > Providers
   - Enable Email provider
   - Disable "Confirm email" (magic links handle confirmation automatically)
   - (Optional) Customize email template with your branding

2. **Configure Redirect URL**:
   - Add your app's deep link scheme to allowed redirect URLs
   - Example: `exp+discloser://auth/callback` (for Expo Go) or `discloser://auth/callback` (for production)
   - This is handled automatically via `Linking.createURL()` in the app

**Note**: No additional setup needed - the app uses Supabase's built-in magic link functionality.

#### Authentication Provider Priority

**iOS:**
- Primary: Apple Sign-In (native, best UX)
- Secondary: Google Sign-In (browser-based OAuth)
- Fallback: Magic Link (email)

**Android:**
- Primary: Google Sign-In (native, best UX)
- Fallback: Magic Link (email)

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
   GoogleSignInButton.tsx   # Google Sign-In button
   MagicLinkForm.tsx       # Email-based magic link form
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
  google-auth.ts       # Google Sign-In helpers (Android native, iOS OAuth)
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
