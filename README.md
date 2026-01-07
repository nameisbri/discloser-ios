# Discloser

A mobile app for managing and sharing STI test results securely.

## Features

- **Upload Test Results** - Scan documents with AI-powered extraction (Google Cloud Vision OCR + LLM parsing)
- **Document Verification** - Automatic verification for recognized Canadian labs (LifeLabs, Public Health Ontario, etc.)
- **Track History** - View all your test results in one place
- **Share Securely** - Generate time-limited links or QR codes to share results
- **Share Status** - Share your aggregated STI status across all tests
- **Reminders** - Set recurring reminders for regular testing with push notifications
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
- Tables: profiles, test_results, reminders, share_links, status_share_links
- Storage bucket: test-documents
- RLS policies and helper functions

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
  (protected)/         # Authenticated screens
components/            # Reusable UI components
lib/
  hooks/               # React hooks for data fetching
  parsing/             # Document OCR and LLM parsing
  supabase.ts          # Supabase client
  notifications.ts     # Push notification helpers
context/               # Auth context
supabase/              # Database schema
web/                   # Next.js web app for share pages
```

## Web Share Pages

**Live at:** https://discloser-ios.vercel.app

The `web/` directory contains a Next.js app for displaying shared results:

- `/share/[token]` - Individual test result
- `/status/[token]` - Aggregated STI status

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
