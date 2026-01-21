# Android Platform Support & Multi-Provider Authentication

**Date:** 2026-01-19
**Status:** In Progress
**Author:** AI (with human review)

## Overview

Expand Discloser from iOS-only to cross-platform (iOS + Android) by adding Android build configuration and implementing multiple authentication providers. This enables users to sign in via Apple (iOS), Google (Android/iOS), or Magic Link (email-based, both platforms).

## Background

Discloser currently uses Expo SDK 54 with Apple Sign-In as the sole authentication method. This restricts the app to iOS users only. To reach Android users, we need:

1. Android-specific build configuration
2. Alternative authentication methods (Apple Sign-In is iOS-only)
3. A platform-agnostic option for users who prefer not to use social logins

### Related Work
- Current auth implementation: `context/auth.tsx`
- Supabase configuration: `lib/supabase.ts`
- Database schema: `supabase/schema.sql`
- Login UI: `app/(auth)/login.tsx`

---

## Implementation Progress

### ✅ Completed
- [x] **Google Sign-In for iOS** - Supabase OAuth flow with browser (`expo-web-browser`)
- [x] **Google Sign-In for Android** - Native Google Sign-In via `@react-native-google-signin/google-signin`
- [x] **Magic Link Authentication** - Email-based passwordless auth via Supabase OTP
- [x] **Auth Provider UI** - Multi-provider login screen with all options
- [x] **Auth Context** - Extended with `signInWithGoogle()` and `signInWithMagicLink()`
- [x] **Deep Link Handling** - Magic link callback handling in auth context
- [x] **Platform-Aware Components** - `GoogleSignInButton` and `MagicLinkForm`

### ⏳ In Progress
- [ ] **Android Build Configuration** - Verify Android package, permissions, build profiles
- [ ] **Android Testing** - Verify all features work on Android devices/emulators

### 📋 Pending
- [ ] **Auth Callback Screen** - Dedicated `auth-callback.tsx` route for deep links (currently handled in context)
- [ ] **Cross-Platform Testing** - Comprehensive testing on both iOS and Android
- [ ] **Documentation Updates** - Complete setup guides for Android development

---

## Requirements

### Functional Requirements

#### Android Platform
- [ ] FR1: App compiles and runs on Android devices
- [ ] FR2: App maintains feature parity with iOS (dashboard, upload, reminders, sharing)
- [ ] FR3: Push notifications work on Android via FCM
- [ ] FR4: Calendar integration works on Android

#### Authentication - Google Sign-In
- [ ] FR5: Android users can sign in with Google
- [ ] FR6: iOS users can optionally sign in with Google (if they prefer)
- [ ] FR7: Google auth creates/links Supabase user account
- [ ] FR8: Session management is consistent across providers

#### Authentication - Magic Link
- [ ] FR9: Users can sign in via email (Magic Link)
- [ ] FR10: Magic link is sent to user's email address
- [ ] FR11: Clicking the link authenticates and opens the app
- [ ] FR12: Magic link auth works on both iOS and Android
- [ ] FR13: Magic links expire after reasonable time (default: 1 hour)

### Non-Functional Requirements
- [ ] NFR1: Auth flows complete in < 5 seconds (network dependent)
- [ ] NFR2: Deep linking handles auth callbacks correctly
- [ ] NFR3: Secure token storage on both platforms (AsyncStorage encrypted)
- [ ] NFR4: Graceful error handling with user-friendly messages

### Out of Scope
- Email/password authentication (not magic link)
- Account linking between different OAuth providers
- Biometric authentication (Face ID / fingerprint unlock)
- Social login providers other than Apple and Google

---

## Analysis

### Repository Analysis

**Architecture pattern:** Feature-based with Expo Router file-based routing
**Auth implementation:** Supabase Auth with React Context
**Relevant existing code:**
- `context/auth.tsx` — AuthProvider, signInWithApple(), signOut()
- `lib/supabase.ts` — Supabase client configuration
- `app/(auth)/login.tsx` — Login UI (currently Apple-only)
- `app.json` — App configuration (iOS-focused)
- `eas.json` — Build configuration

**Established conventions:**
- Context providers in `context/`
- Utility functions in `lib/`
- NativeWind for styling
- Fail-hard error handling

**Testing setup:** Jest with `__tests__/` directory

### Integration Points

| System | Integration |
|--------|-------------|
| Supabase Auth | Add Google and Magic Link providers |
| Expo Router | Deep link handling for magic link callbacks |
| Push Notifications | Configure FCM for Android |
| App Store / Play Store | Separate builds and submission |

### Potential Conflicts
- `expo-apple-authentication` plugin is iOS-only (must handle gracefully on Android)
- Different OAuth callback schemes per platform
- Google Sign-In requires different client IDs for iOS vs Android

---

## Implementation Strategy

### Approach

**Phase 1: Android Foundation** — Configure Android build, test basic app functionality
**Phase 2: Google Sign-In** — Add Google auth provider for Android (optionally iOS)
**Phase 3: Magic Link** — Add email-based passwordless authentication
**Phase 4: Polish & Testing** — Unified UX, comprehensive testing, documentation

### Dependency Analysis

#### Existing Dependencies to Leverage
| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.x | Already supports multiple auth providers |
| `expo-notifications` | ^0.28.x | Push notifications (both platforms) |
| `expo-calendar` | ^13.0.x | Calendar access (both platforms) |
| `expo-linking` | (bundled) | Deep link handling |

#### New Dependencies Required
| Package | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| `@react-native-google-signin/google-signin` | ^12.x | Native Google Sign-In | Best native experience, required for credential manager on Android |
| `expo-auth-session` | ^5.x | OAuth session handling | Expo-native OAuth flow management (alternative approach) |

#### Dependencies to Avoid
| Package | Reason |
|---------|--------|
| `react-native-app-auth` | More complex setup, expo-auth-session preferred |
| `@invertase/react-native-apple-authentication` | Already using `expo-apple-authentication` |

### Decision Point: Google Sign-In Approach

**Option A: `@react-native-google-signin/google-signin`** (Recommended)
- Native credential manager integration on Android
- One-tap sign-in support
- Requires `expo prebuild` (already compatible with your setup)
- Better UX, faster auth

**Option B: `expo-auth-session` with Google OAuth**
- Pure JavaScript, no native modules
- Works without prebuild
- Slower UX (browser-based)
- Simpler setup

**Recommendation:** Option A for production-quality UX, especially important for Android.

---

## Files to Modify

| File | Changes | Reason |
|------|---------|--------|
| `app.json` | Add Android package, Google Sign-In config, deep linking | Enable Android builds and OAuth |
| `eas.json` | Add Android build profiles, credentials config | EAS Build for Android |
| `context/auth.tsx` | Add signInWithGoogle(), signInWithMagicLink() | Multi-provider support |
| `lib/supabase.ts` | Update for deep link handling | Magic link callback |
| `app/(auth)/login.tsx` | Add Google and Magic Link buttons | Multi-provider UI |
| `app/(auth)/_layout.tsx` | Handle deep link auth callbacks | Magic link completion |
| `package.json` | Add new dependencies | Google Sign-In package |

## Files to Create

| File | Purpose |
|------|---------|
| `lib/google-auth.ts` | Google Sign-In configuration and helpers |
| `lib/magic-link.ts` | Magic link flow helpers |
| `components/GoogleSignInButton.tsx` | Platform-aware Google button |
| `components/MagicLinkForm.tsx` | Email input form for magic link |
| `app/(auth)/magic-link-sent.tsx` | Confirmation screen after sending link |
| `app/(auth)/auth-callback.tsx` | Deep link handler for magic link |

---

## Step-by-Step Implementation

### Phase 1: Android Foundation

#### Step 1.1: Configure Android in app.json
- [ ] Add `android.package` (e.g., `com.discloser.app`)
- [ ] Configure `android.adaptiveIcon` (already partial)
- [ ] Add `android.permissions` if needed
- [ ] Configure `android.intentFilters` for deep linking
- **Acceptance Criteria:** `expo prebuild --platform android` succeeds
- **Tests to Write:** Manual verification on Android emulator

#### Step 1.2: Configure EAS Build for Android
- [ ] Add Android-specific build profiles to `eas.json`
- [ ] Set up Android signing (keystore)
- [ ] Configure internal distribution for testing
- **Acceptance Criteria:** `eas build --platform android --profile development` succeeds
- **Tests to Write:** Install and run dev build on Android device

#### Step 1.3: Test Core Features on Android
- [ ] Verify navigation works
- [ ] Verify push notifications (FCM setup)
- [ ] Verify calendar integration
- [ ] Verify file uploads
- [ ] Verify share functionality
- **Acceptance Criteria:** All existing features work on Android (except auth)
- **Tests to Write:** Manual QA checklist

---

### Phase 2: Google Sign-In

#### Step 2.1: Supabase Configuration
- [ ] Enable Google provider in Supabase Dashboard
- [ ] Create Google Cloud project (if not exists)
- [ ] Create OAuth 2.0 credentials:
  - Web Client ID (for Supabase)
  - iOS Client ID (with bundle ID)
  - Android Client ID (with package name + SHA-1)
- [ ] Configure redirect URLs in Supabase
- **Acceptance Criteria:** Google provider enabled and configured in Supabase
- **Tests to Write:** N/A (dashboard configuration)

#### Step 2.2: Install and Configure Google Sign-In Package
- [ ] Install `@react-native-google-signin/google-signin`
- [ ] Add to `app.json` plugins
- [ ] Configure web client ID in environment variables
- [ ] Run `expo prebuild` to generate native projects
- **Acceptance Criteria:** Package installed, native projects updated
- **Tests to Write:** App builds without errors on both platforms

#### Step 2.3: Implement signInWithGoogle()
- [ ] Create `lib/google-auth.ts` with configuration
- [ ] Add `signInWithGoogle()` to AuthContext
- [ ] Handle Google credential → Supabase token exchange
- [ ] Handle errors (cancellation, network, etc.)
- **Acceptance Criteria:** Google auth completes and creates Supabase session
- **Tests to Write:**
  - signInWithGoogle() throws on network error
  - signInWithGoogle() handles user cancellation gracefully
  - Successful auth creates valid session

#### Step 2.4: Create Google Sign-In UI
- [ ] Create `GoogleSignInButton` component
- [ ] Use official Google branding guidelines
- [ ] Show on login screen (Android: primary, iOS: secondary option)
- [ ] Handle loading state during auth
- **Acceptance Criteria:** Google button visible and functional on login screen
- **Tests to Write:** Component renders correctly on each platform

---

### Phase 3: Magic Link Authentication

#### Step 3.1: Configure Deep Linking
- [ ] Define URL scheme (e.g., `discloser://`)
- [ ] Add to `app.json` for both platforms
- [ ] Configure Supabase redirect URL
- [ ] Handle incoming deep links in app
- **Acceptance Criteria:** App opens when deep link is triggered
- **Tests to Write:**
  - Deep link opens app on iOS
  - Deep link opens app on Android
  - Invalid deep links handled gracefully

#### Step 3.2: Implement signInWithMagicLink()
- [ ] Create `lib/magic-link.ts` with helpers
- [ ] Add `signInWithMagicLink(email)` to AuthContext
- [ ] Use `supabase.auth.signInWithOtp({ email })`
- [ ] Handle rate limiting and errors
- **Acceptance Criteria:** Magic link email sent successfully
- **Tests to Write:**
  - signInWithMagicLink() throws on invalid email
  - signInWithMagicLink() handles rate limit error
  - Email sent confirmation returned on success

#### Step 3.3: Create Magic Link UI Flow
- [ ] Create `MagicLinkForm` component (email input)
- [ ] Create `magic-link-sent.tsx` screen (check your email message)
- [ ] Add magic link option to login screen
- [ ] Handle "resend" functionality
- **Acceptance Criteria:** User can enter email and receives confirmation
- **Tests to Write:** Form validation works, confirmation screen shows

#### Step 3.4: Handle Magic Link Callback
- [ ] Create `auth-callback.tsx` route
- [ ] Parse incoming deep link for tokens
- [ ] Exchange tokens with Supabase
- [ ] Redirect to appropriate screen (onboarding or dashboard)
- [ ] Handle expired/invalid links with error message
- **Acceptance Criteria:** Clicking magic link signs user in
- **Tests to Write:**
  - Valid token exchange creates session
  - Expired link shows appropriate error
  - Invalid link handled gracefully

---

### Phase 4: Polish & Testing

#### Step 4.1: Unified Login Experience
- [ ] Design consistent login screen layout for both platforms
- [ ] Platform-specific primary action (Apple on iOS, Google on Android)
- [ ] Magic link as universal fallback option
- [ ] Clear visual hierarchy and accessibility
- **Acceptance Criteria:** Login UX is intuitive on both platforms
- **Tests to Write:** Accessibility tests, visual QA

#### Step 4.2: Error Handling & Edge Cases
- [ ] Handle account already exists (different provider)
- [ ] Handle network errors during auth
- [ ] Handle app backgrounded during OAuth
- [ ] Handle deep link when app not running
- **Acceptance Criteria:** All edge cases have user-friendly handling
- **Tests to Write:** Unit tests for each error scenario

#### Step 4.3: Documentation & Cleanup
- [ ] Update README with Android build instructions
- [ ] Document environment variables needed
- [ ] Update `.ai-context/` with auth architecture decisions
- [ ] Remove any iOS-only code paths that are no longer needed
- **Acceptance Criteria:** New developer can build and run on both platforms
- **Tests to Write:** N/A (documentation)

---

## Standards Validation

### Fail Hard Policy Compliance

#### Error Handling Approach
- Auth errors throw typed exceptions (`AuthError`, `NetworkError`)
- User cancellation is NOT an error (return gracefully)
- Network failures propagate to UI for user retry
- Invalid tokens throw, do not silently fail

#### Verification Checklist
- [ ] All new auth functions throw on failure
- [ ] No try/catch that suppresses genuine errors
- [ ] No fallback sessions on auth failure
- [ ] Error messages include actionable context
- [ ] Tests verify error conditions throw

### Programming Principles

#### SOLID Compliance
- [ ] **S**: Separate files for Google auth, Magic Link, UI components
- [ ] **O**: AuthContext extended with new methods, not rewritten
- [ ] **L**: All auth methods return consistent Session type
- [ ] **I**: Each auth method has focused interface
- [ ] **D**: Components depend on AuthContext abstraction

#### Other Principles
- [ ] **DRY**: Shared auth state management, no duplication
- [ ] **KISS**: Simple flows, avoid over-engineering
- [ ] **YAGNI**: Only implement requested auth methods
- [ ] **Composition over Inheritance**: Hooks and context composition

### Testing Strategy

#### Test Types Required
- [ ] Unit tests for auth utility functions
- [ ] Integration tests for AuthProvider
- [ ] E2E manual testing on real devices

#### Coverage Requirements
- [ ] New auth code has > 80% coverage
- [ ] All error paths tested
- [ ] Platform-specific code paths verified

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google OAuth credential management complexity | Medium | Medium | Document setup clearly, use environment variables |
| Deep linking inconsistencies between platforms | Medium | High | Test extensively on both platforms, handle edge cases |
| Supabase rate limiting on magic links | Low | Medium | Implement cooldown UI, show rate limit errors |
| Native module compatibility issues | Low | High | Pin versions, test on multiple devices |
| App Store / Play Store rejection | Low | High | Follow platform guidelines, proper privacy policy |

---

## Success Criteria

- [ ] App builds and runs on Android
- [ ] Android users can sign in with Google
- [ ] iOS users can still sign in with Apple
- [ ] Both platforms support Magic Link sign-in
- [ ] All existing features work on Android
- [ ] All tests pass
- [ ] CI/CD builds both platforms
- [ ] Documentation is complete

---

## Decisions Made

- [x] **Q1:** Should Google Sign-In be available on iOS as well, or Apple-only on iOS?
  - **Decision: Both Apple + Google on iOS** — Users can choose their preferred provider

- [x] **Q2:** What terminology for email-based passwordless login?
  - **Decision: "Continue with Email"** — User-friendly, no jargon

- [x] **Q3:** Should this be separate PRs or one large feature?
  - **Decision: Separate PRs per phase** — Easier review, ship incrementally

- [ ] **Q4:** Do we need to support Android versions older than Android 8 (API 26)?
  - Recommendation: Target Android 8+ (covers 95%+ of devices)

- [ ] **Q5:** What email service does Supabase use, and are there deliverability concerns?
  - Note: Supabase has built-in email, or can configure custom SMTP

---

## Supabase Dashboard Configuration Checklist

Before implementation, configure in Supabase Dashboard:

### Authentication → Providers

1. **Apple** (already configured)
   - Verify Service ID matches app.json bundleIdentifier

2. **Google** (new)
   - [ ] Create Google Cloud Project
   - [ ] Enable Google Sign-In API
   - [ ] Create OAuth consent screen
   - [ ] Create credentials:
     - Web application client (for Supabase)
     - iOS client (bundle ID: `com.discloser-ios.app`)
     - Android client (package: `com.discloser.app`, SHA-1 fingerprint)
   - [ ] Add Web client ID and secret to Supabase

3. **Email** (for Magic Link)
   - [ ] Enable "Email" provider
   - [ ] Disable "Confirm email" (magic link handles this)
   - [ ] Customize email template (optional)
   - [ ] Configure redirect URL with app scheme

### Authentication → URL Configuration

- [ ] Add `discloser://auth-callback` to Redirect URLs
- [ ] Add `com.discloser.app://auth-callback` to Redirect URLs

---

## Environment Variables Required

```bash
# Existing
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx

# New for Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com  # Optional if iOS Google enabled

# Deep linking
EXPO_PUBLIC_APP_SCHEME=discloser
```

---

## Delivery Plan (Separate PRs)

Based on decision to ship in phases:

### PR 1: Android Foundation
- Android build config (app.json, eas.json)
- Verify core features work on Android
- Login shows "Android not yet supported" message
- **Ship when:** Android builds and runs (no auth yet)

### PR 2: Google Sign-In
- Supabase Google provider configuration
- `signInWithGoogle()` implementation
- Google button on login screen (both platforms)
- **Ship when:** Android users can fully use the app

### PR 3: Magic Link / "Continue with Email"
- Deep linking configuration
- `signInWithMagicLink()` implementation
- Email form UI + callback handling
- **Ship when:** All auth options complete

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-01-19 | AI | Initial draft |
| 2026-01-19 | Human | Decisions: Both providers on iOS, "Continue with Email" UX, separate PRs |

