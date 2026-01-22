# iOS Beta Launch - Full Execution Plan

**Date:** 2026-01-20
**Target:** TestFlight Beta Launch in 7 Days
**Resume Points:** 📍 Marked throughout document

---

## ✅ PROGRESS TRACKER

### Day 1 Progress (2026-01-20 to 2026-01-21)

**Build History:**
- v18: Initial beta build
- v19: After removing Google Sign-In from iOS
- v20: Fixed EAS environment variables
- v21: Fixed keyboard avoidance + magic link callback
- v22: Current build - all Day 1 bug fixes

**Bugs Found & Fixed:**
| Bug | Status | Fix |
|-----|--------|-----|
| Keyboard covers email field on login | ✅ Fixed | Added KeyboardAvoidingView |
| Magic link shows "Unmatched route" | ✅ Fixed | Created app/auth/callback.tsx |
| Google Sign-In on iOS (removed) | ✅ Fixed | Wrapped in Platform.OS check |
| Error messages too generic | ✅ Fixed | Improved 10+ Alert.alert calls |
| HIV not consolidated with HIV-1/2 | ✅ Fixed | Updated testNormalizer.ts |
| Share link creation fails | ✅ Fixed | Added verification + better errors |
| Status share "Nothing to share" | ✅ Fixed | Added refetch on modal open |
| Reminders Active tag covers date | ✅ Fixed | Replaced badge with icon |
| Share links don't persist | 🔧 Migration | Missing display_name column |

**Database Migration Required:**
Run `supabase/migrations/003_add_share_links_display_name.sql` in Supabase SQL Editor

### Day 2 Progress (2026-01-21)

**Error Message Improvements:**
All generic error messages replaced with user-friendly, actionable messages:
- ✅ context/auth.tsx - 6 error messages improved
- ✅ app/(protected)/upload.tsx - 2 error messages improved
- ✅ components/MagicLinkForm.tsx - 1 error message improved
- ✅ app/(onboarding)/index.tsx - 1 error message improved
- ✅ lib/hooks/useTestResults.ts - 5 error messages improved
- ✅ lib/hooks/useProfile.ts - 4 error messages improved
- ✅ lib/hooks/useShareLinks.ts - 3 error messages improved
- ✅ lib/hooks/useReminders.ts - 4 error messages improved

**Pattern Applied:**
- Before: "Failed to [action]"
- After: "We couldn't [action]. Please check your internet connection and try again."

**Documentation Created:**
- EDGE_CASE_TESTING.md - Comprehensive edge case testing guide for device testing

**Next Steps:**
- Run migration in Supabase
- Test edge cases on physical device (see EDGE_CASE_TESTING.md)
- Move to Day 3: Loading states and accessibility

**Testing Completed:**
- [x] Apple Sign-In
- [x] Magic Link login
- [x] Session persistence
- [x] Upload document (OCR + parsing)
- [x] Manual entry
- [x] View test results
- [x] Create share link (needs migration for persistence)
- [x] Create status share
- [x] Create reminder
- [x] Add to calendar
- [ ] Push notifications (debug button added to Settings)
- [x] Delete reminder

**Files Modified:**
- app.json (build number 17 → 22)
- app/(auth)/login.tsx (keyboard avoidance, removed Google on iOS)
- app/auth/callback.tsx (NEW - magic link handler)
- app/(protected)/reminders.tsx (UI fix)
- app/(protected)/settings.tsx (notification debug button)
- components/ShareModal.tsx (error handling)
- components/StatusShareModal.tsx (refetch on open)
- lib/hooks/useShareLinks.ts (verification + logging)
- lib/hooks/useSTIStatus.ts (expose refetch)
- lib/parsing/testNormalizer.ts (HIV normalization)
- supabase/schema.sql (added display_name)
- supabase/migrations/003_add_share_links_display_name.sql (NEW)

---

## 🎯 EXECUTION CHECKLIST (Quick Reference)

**Day 1:** ✅ Real device testing, bug fixes (COMPLETE - pending migration)
**Day 2:** ✅ Error message improvements, edge case documentation (COMPLETE - device testing pending)
**Day 3:** Loading states, accessibility
**Day 4:** TestFlight build, distribution
**Day 5:** App Store assets, metadata
**Day 6:** Final testing, legal docs
**Day 7:** Invite testers, code freeze

---

## 📍 RESUME POINT 1: START HERE (Day 1)

### DAY 1: Critical Testing & Bug Fixes

**Goal:** All core features working reliably on real iOS device

#### STEP 1.1: Build TestFlight Version

**Commands:**
```bash
# Ensure you're on clean state
git status

# Create branch for beta prep
git checkout -b ios-beta-launch

# Update build number in app.json
# Change "buildNumber": "17" to "18"
```

**File to edit:** `app.json`
```json
"buildNumber": "18"  // Increment from 17
```

**Command:**
```bash
# Build TestFlight distribution
eas build --platform ios --profile preview
```

**Wait for build completion** (~30-45 minutes). Download the `.ipa` file and install via Xcode or TestFlight.

**Acceptance Criteria:** App installs and opens on real iPhone device

---

#### STEP 1.2: Test Authentication Flows

**Procedure:**

1. **Apple Sign-In (Primary)**
   - [ ] Tap "Sign in with Apple"
   - [ ] Enter Apple ID credentials
   - [ ] Grant name/email permissions
   - [ ] Verify: Redirects to dashboard or onboarding
   - [ ] If first time: Complete onboarding
   - [ ] Verify: Profile created in Supabase

2. **Google Sign-In (Secondary)**
   - [ ] Tap "Continue with Google"
   - [ ] Verify: Opens Safari with Google OAuth
   - [ ] Sign in with Google account
   - [ ] Verify: Redirects back to app
   - [ ] Verify: Redirects to dashboard or onboarding
   - [ ] If first time: Complete onboarding

3. **Magic Link (Fallback)**
   - [ ] Tap "Enter your email"
   - [ ] Enter test email: `test+beta@example.com`
   - [ ] Tap "Continue with Email"
   - [ ] Verify: Shows "Check your email" message
   - [ ] Open email and tap magic link
   - [ ] Verify: Opens app with session

4. **Sign Out & Sign In**
   - [ ] Go to Settings → Sign Out
   - [ ] Verify: Returns to login screen
   - [ ] Sign in again with same provider
   - [ ] Verify: Previous data still exists

5. **Session Persistence**
   - [ ] Close app (swipe up)
   - [ ] Reopen app
   - [ ] Verify: Still signed in
   - [ ] Verify: Shows dashboard

**Bug Tracking:** Create spreadsheet: `https://docs.google.com/spreadsheets/` (create new)
Columns: ID, Feature, Description, Severity, Steps to Reproduce, Status

**Acceptance Criteria:** All auth flows complete successfully without crashes

---

#### STEP 1.3: Test Core Features

**Procedure:**

1. **Onboarding Flow**
   - [ ] Sign in with new account
   - [ ] Enter name (or skip)
   - [ ] Enter alias
   - [ ] Enter date of birth
   - [ ] Complete 4-question risk assessment
   - [ ] Verify: Risk level calculated (Low/Moderate/High)
   - [ ] Add known condition (optional)
   - [ ] Verify: Onboarding completes
   - [ ] Verify: Lands on dashboard

2. **Upload Test Result**
   - [ ] Go to Dashboard → Upload
   - [ ] Tap "Select from Gallery"
   - [ ] Choose test result PDF
   - [ ] Tap "Auto-Extract Data"
   - [ ] Verify: Parsing completes
   - [ ] Verify: Test date populated
   - [ ] Verify: STI results populated
   - [ ] Tap "Save Test Result"
   - [ ] Verify: Returns to dashboard
   - [ ] Verify: New test appears in dashboard

3. **Manual Entry**
   - [ ] Go to Upload → Manual Entry
   - [ ] Enter test date
   - [ ] Select test type
   - [ ] Add STI result (name, result)
   - [ ] Verify: Status badge shows correctly
   - [ ] Tap "Save Test Result"
   - [ ] Verify: Appears in dashboard

4. **View Test Result**
   - [ ] Tap on test result in dashboard
   - [ ] Verify: Test result detail screen opens
   - [ ] Verify: All STI results displayed
   - [ ] Verify: Test date correct
   - [ ] Verify: Verification badge shows if verified
   - [ ] Tap "Share" button
   - [ ] Tap "Back" button
   - [ ] Verify: Returns to dashboard

5. **Delete Test Result**
   - [ ] Swipe left on test result
   - [ ] Tap "Delete"
   - [ ] Verify: Confirmation dialog appears
   - [ ] Confirm deletion
   - [ ] Verify: Test removed from dashboard

**Acceptance Criteria:** All core CRUD operations work without crashes

---

#### STEP 1.4: Test Sharing Features (CRITICAL)

**Procedure:**

1. **Create Individual Share Link**
   - [ ] Tap on test result
   - [ ] Tap "Share" button
   - [ ] Verify: Share modal opens
   - [ ] Set expiry to "1 hour"
   - [ ] Set view limit to "3 views"
   - [ ] Toggle "Show my name" OFF
   - [ ] Tap "Create Link"
   - [ ] Verify: Shows QR code and link
   - [ ] Tap "Copy Link"
   - [ ] Paste link in Safari (on another device or same device)
   - [ ] Verify: Share page loads
   - [ ] Verify: Shows test results
   - [ ] Verify: Does NOT show name
   - [ ] Verify: Shows verification badge if applicable

2. **Test Share Link Expiry**
   - [ ] Create link with "5 minutes" expiry (for testing)
   - [ ] Copy link
   - [ ] Wait 5 minutes
   - [ ] Open link in Safari
   - [ ] Verify: Shows "This link vanished" error

3. **Test Share Link View Limit**
   - [ ] Create link with "1 view" limit
   - [ ] Open link once → verify it works
   - [ ] Refresh page or open in new tab
   - [ ] Verify: Shows "That's a wrap" (max views reached)

4. **Share with Name**
   - [ ] Create link with "Show my name" ON
   - [ ] Open link in Safari
   - [ ] Verify: Shows display name
   - [ ] Verify: Format: "Shared by [Name]"

5. **Create Status Share Link**
   - [ ] Go to Dashboard → Status
   - [ ] Tap "Share Status"
   - [ ] Verify: Status share modal opens
   - [ ] Verify: Shows all STIs with latest results
   - [ ] Verify: Overall status displayed
   - [ ] Set expiry to "24 hours"
   - [ ] Toggle "Show my name" OFF
   - [ ] Tap "Share Status"
   - [ ] Verify: Shows QR code and link
   - [ ] Copy link and open in Safari
   - [ ] Verify: Shows aggregated status
   - [ ] Verify: All STIs listed

**Acceptance Criteria:** All sharing features work correctly with privacy controls

---

#### STEP 1.5: Test Reminders

**Procedure:**

1. **Create Reminder**
   - [ ] Go to Dashboard → Reminders
   - [ ] Tap "Add Reminder"
   - [ ] Enter title: "Routine STI Test"
   - [ ] Set frequency: "Quarterly"
   - [ ] Set next date: Today + 90 days
   - [ ] Tap "Save"
   - [ ] Verify: Reminder appears in list

2. **Add to Calendar**
   - [ ] Tap on reminder
   - [ ] Tap "Add to Calendar"
   - [ ] Verify: Opens Calendar app
   - [ ] Verify: Event is pre-filled
   - [ ] Verify: Save event

3. **Edit Reminder**
   - [ ] Tap on reminder
   - [ ] Change frequency to "Biannual"
   - [ ] Change next date
   - [ ] Tap "Save"
   - [ ] Verify: Reminder updated

4. **Delete Reminder**
   - [ ] Swipe left on reminder
   - [ ] Tap "Delete"
   - [ ] Confirm deletion
   - [ ] Verify: Reminder removed

**Note:** Push notifications require TestFlight to be in production configuration for full testing. Test notification triggering but may not receive until after review.

**Acceptance Criteria:** Reminder CRUD and calendar integration work

---

#### STEP 1.6: Bug Fix Session

**Procedure:**

1. **Review Bug Spreadsheet**
   - Sort by severity (Critical → High → Medium → Low)

2. **Fix Critical Bugs First**
   - App crashes
   - Data not saving
   - Authentication loops
   - Sharing failures

3. **Fix High Bugs**
   - UI glitches
   - Confusing error messages
   - Feature not working as expected

4. **Test Fixes**
   - Re-run affected test cases
   - Verify fix doesn't break other features

5. **Update Bug Spreadsheet**
   - Mark as "Fixed" or "Won't Fix"
   - Add notes

**Acceptance Criteria:** No critical or high severity bugs remaining

---

### 📍 RESUME POINT 2: START DAY 2 (After completing Day 1)

### DAY 2: UX Polish & Edge Cases

**Goal:** Smooth user experience with proper error handling

#### STEP 2.1: Test Edge Cases

**Procedure:**

1. **Poor Network Connection**
   - [ ] Turn on Airplane Mode
   - [ ] Try to sign in
   - [ ] Verify: Shows network error message
   - [ ] Try to upload test result
   - [ ] Verify: Shows network error message
   - [ ] Turn off Airplane Mode
   - [ ] Retry operation
   - [ ] Verify: Works successfully

2. **App Backgrounding During Operations**
   - [ ] Start uploading test result
   - [ ] Immediately press home button
   - [ ] Wait 5 seconds
   - [ ] Reopen app
   - [ ] Verify: Upload completed or shows error

3. **Magic Link State Handling**
   - [ ] While logged out: Open magic link from email
   - [ ] Verify: Signs in and goes to dashboard
   - [ ] Sign out
   - [ ] While logged in with DIFFERENT account: Open magic link
   - [ ] Verify: Shows error or prompts to sign out first

4. **Document Parsing Edge Cases**
   - [ ] Upload corrupted PDF
   - [ ] Verify: Shows error, doesn't crash
   - [ ] Upload scanned image (PDF may fail)
   - [ ] Verify: Falls back to manual entry gracefully
   - [ ] Upload PDF with no recognizable format
   - [ ] Verify: Parsing fails gracefully

**Acceptance Criteria:** App handles edge cases without crashing

---

#### STEP 2.2: Improve Error Messages

**Files to review:**
- `context/auth.tsx` - Auth errors
- `app/(protected)/upload.tsx` - Upload errors
- `lib/hooks/useTestResults.ts` - Data errors

**Procedure:**

1. **Review All Error Messages**
   - Are they human-readable?
   - Do they explain what happened?
   - Do they suggest what to do?

2. **Improve Generic Messages**

Example improvements:
```typescript
// ❌ Before:
Alert.alert("Error", "Failed to sign in");

// ✅ After:
Alert.alert("Sign In Failed", "We couldn't sign you in. Please check your internet connection and try again.");
```

3. **Add Retry Buttons**
   - Network errors: Show "Retry" button
   - Auth errors: Show "Try Again" button

**Acceptance Criteria:** All error messages are clear and actionable

---

#### STEP 2.3: Test Accessibility

**Procedure:**

1. **VoiceOver Testing**
   - [ ] Enable VoiceOver (Settings → Accessibility → VoiceOver)
   - [ ] Navigate through login screen
   - [ ] Verify: All buttons are announced
   - [ ] Verify: Text fields are labeled
   - [ ] Navigate through dashboard
   - [ ] Navigate through share modal
   - [ ] Verify: All elements accessible

2. **Dynamic Type Testing**
   - [ ] Increase text size (Settings → Display & Brightness → Text Size)
   - [ ] Set to "Larger Accessibility"
   - [ ] Navigate app
   - [ ] Verify: Text doesn't overflow
   - [ ] Verify: All text is readable

3. **Color Contrast**
   - [ ] Test in light mode
   - [ ] Test in dark mode
   - [ ] Verify: All text has sufficient contrast
   - [ ] Use accessibility checker if available

**Acceptance Criteria:** App is usable with VoiceOver and large text

---

### 📍 RESUME POINT 3: START DAY 3 (After completing Day 2)

### DAY 3: Visual Polish & Performance

**Goal:** Professional appearance with smooth performance

#### STEP 3.1: Add Loading Indicators

**Procedure:**

**File to check:** All async operations should have loading state

1. **Review Async Operations**
   - Sign in buttons → Show spinner
   - Upload form → Show progress indicator
   - Share link creation → Show spinner
   - Data fetching → Show skeleton or spinner

2. **Test Loading States**
   - [ ] Start operation
   - [ ] Verify: Loading indicator appears immediately
   - [ ] Verify: Cannot tap other buttons (disabled)
   - [ ] Wait for completion
   - [ ] Verify: Loading indicator disappears
   - [ ] Verify: Next action available

**Acceptance Criteria:** All async operations show loading state

---

#### STEP 3.2: Performance Testing

**Procedure:**

1. **Launch Time**
   - [ ] Close app completely (force quit)
   - [ ] Launch app
   - [ ] Count seconds to show login screen
   - [ ] Target: < 3 seconds

2. **Navigation Performance**
   - [ ] Navigate between screens
   - [ ] Verify: Smooth transitions
   - [ ] Verify: No visible lag

3. **List Performance**
   - [ ] Add 20+ test results
   - [ ] Scroll through dashboard
   - [ ] Verify: Smooth scrolling
   - [ ] Verify: No dropped frames

**Acceptance Criteria:** App feels smooth and responsive

---

#### STEP 3.3: Final UI Polish

**Procedure:**

1. **Check All Screens for:**
   - [ ] Consistent spacing (16px, 24px, 32px)
   - [ ] Consistent typography
   - [ ] Consistent colors
   - [ ] No clipped text
   - [ ] No overlapping elements
   - [ ] Proper keyboard avoidance (text fields not hidden)

2. **Test Light/Dark Mode**
   - [ ] Toggle theme in Settings
   - [ ] Navigate all screens
   - [ ] Verify: All screens look good in both themes
   - [ ] Verify: No color contrast issues

**Acceptance Criteria:** App looks professional and consistent

---

### 📍 RESUME POINT 4: START DAY 4 (After completing Day 3)

### DAY 4: TestFlight Setup

**Goal:** Build and distribute via TestFlight

#### STEP 4.1: Configure TestFlight Build

**Commands:**
```bash
# Review current EAS configuration
cat eas.json
```

**File to check:** `eas.json`

If missing preview profile, add:
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

#### STEP 4.2: Build TestFlight Version

**Commands:**
```bash
# Update build number to 19
# Edit app.json: "buildNumber": "19"

# Commit changes
git add app.json
git commit -m "Bump build number to 19 for TestFlight"

# Build TestFlight distribution
eas build --platform ios --profile preview
```

**Wait time:** ~30-45 minutes

**Monitor build:** Go to https://expo.dev and watch build progress

---

#### STEP 4.3: Upload to TestFlight

**Procedure:**

1. **Download Build**
   - When EAS build completes
   - Download `.ipa` file
   - Note: EAS auto-uploads to TestFlight if configured

2. **If Auto-Upload Not Working**
   - Open Xcode
   - File → Open → Select `Discloser.xcodeproj`
   - Product → Archive
   - Distribute App → TestFlight & App Store
   - Follow prompts to upload

3. **Wait for TestFlight Processing**
   - Processing time: ~30 minutes
   - Monitor: https://appstoreconnect.apple.com

---

#### STEP 4.4: Test TestFlight Build

**Procedure:**

1. **Install on Real Device**
   - Open TestFlight app on device
   - Find "Discloser - Beta"
   - Tap "Install"
   - Wait for installation

2. **Run Through Core Tests**
   - [ ] Open app
   - [ ] Sign in with Apple
   - [ ] Complete onboarding (if new account)
   - [ ] Upload test result
   - [ ] Create share link
   - [ ] Test share link in Safari
   - [ ] Create reminder
   - [ ] Navigate all screens

3. **Compare to Development Build**
   - [ ] Check for any regressions
   - [ ] Verify features match dev build
   - [ ] Note any differences

**Acceptance Criteria:** TestFlight build works on real device

---

### 📍 RESUME POINT 5: START DAY 5 (After completing Day 4)

### DAY 5: App Store Preparation

**Goal:** All assets and metadata ready

#### STEP 5.1: Create App Store Screenshots

**Required Sizes:**
- 6.7" display: 1290 x 2796 (iPhone 14 Pro Max)
- 6.5" display: 1242 x 2688 (iPhone 12 Pro Max)

**Recommended:**
- 5.5" display: 1242 x 2208 (iPhone 8 Plus)
- 12.9" display: 2048 x 2732 (iPad Pro)

**Screenshots to Capture:**
1. Login screen (with Apple button)
2. Dashboard (with test results)
3. Upload screen
4. Share modal
5. Reminders screen

**Tools:**
- Use iPhone simulator or real device
- Take screenshots: Cmd + Shift + 4 (select area)
- Or use Xcode: Debug → Take Screenshot
- Save to `assets/screenshots/`

**Procedure:**
```bash
# Create screenshots directory
mkdir -p assets/screenshots

# Take screenshots (manual process)
# Use simulator or real device
```

**Naming Convention:**
- `6.7-login.png`
- `6.7-dashboard.png`
- `6.7-upload.png`
- `6.7-share.png`
- `6.7-reminders.png`

**Acceptance Criteria:** At least 5 screenshots for each required size

---

#### STEP 5.2: Verify App Icon

**File to check:** `assets/icon.png`

**Requirements:**
- Size: 1024 x 1024 pixels
- No transparency
- No rounded corners (iOS adds automatically)
- No gloss effect
- Recognizable at small sizes

**Procedure:**
```bash
# Check icon size
file assets/icon.png

# If wrong size, need to recreate
```

**Acceptance Criteria:** Icon meets Apple guidelines

---

#### STEP 5.3: Write App Store Metadata

**Create file:** `assets/app-store-metadata.txt`

**Content Template:**
```
Name: Discloser
Subtitle: Privacy-first STI status sharing
Description:
Discloser lets you share your STI test results without exposing your identity.

Share proof, not your life story. Generate time-limited, view-limited links that expire automatically. Your partner sees your status—not your name, date of birth, or health card number.

FEATURES:
• Upload test results with AI-powered extraction
• Share links that vanish after you set them to expire
• Set view limits—share once, twice, or as many times as you choose
• Track your testing history in one place
• Get personalized reminders based on your risk level
• Privacy-first design with row-level security

WHY DISCLOSER:
Being responsible shouldn't cost you your privacy. Lab results contain personal information—your full name, date of birth, health card number—that stays on someone's phone forever once they take a screenshot.

With Discloser, you share the verification, not the identity.

PRIVACY:
• Your data stays private with row-level security
• Links auto-expire—you control how long they last
• No data selling or tracking
• Anonymous sharing options

Download Discloser and share your status. Keep your name.

Keywords: STI test results, sexual health, privacy, health tracking, test sharing
Category: Health & Fitness
Age Rating: 17+ (Medical/Health information)
```

**Acceptance Criteria:** Metadata is compelling and accurate

---

#### STEP 5.4: Create Legal Documents

**Create file:** `web/privacy.md`

```markdown
---
title: Privacy Policy
---

# Privacy Policy

Last Updated: January 20, 2026

## 1. Information We Collect

### Information You Provide
- **Authentication Data**: Email address (when using Magic Link), Apple ID/Google ID (when using social login)
- **Profile Information**: Name, alias, date of birth, pronouns (optional)
- **Health Information**: STI test results, test dates, known conditions
- **Usage Data**: Testing reminders, share links created

### Information Collected Automatically
- **Device Information**: Device type, operating system version (for app functionality)
- **Usage Analytics**: Anonymous usage statistics to improve the app

## 2. How We Use Your Information

- To provide and improve the app
- To manage your account and authentication
- To enable secure sharing of test results
- To send push notifications for testing reminders
- To analyze usage patterns (anonymized)

## 3. Data Storage & Security

- **Storage**: Your data is stored securely on Supabase (encrypted at rest)
- **Access**: Only you can access your data (row-level security)
- **Sharing**: When you share a test result, you control:
  - Whether to show your name
  - How long the link is valid
  - How many times the link can be viewed
- **Deletion**: You can delete your data at any time through the app

## 4. Third-Party Services

We use the following services to provide the app:

- **Supabase**: Backend services (auth, database, storage)
- **Expo**: App framework and build services
- **Google Cloud Vision**: Document OCR (for test result parsing)
- **OpenRouter**: AI services (for document parsing)
- **Apple/Google**: Authentication services

## 5. Your Rights

- **Access**: View all data stored in the app
- **Correction**: Edit your profile information
- **Deletion**: Delete your account and all associated data
- **Opt-out**: Disable push notifications in Settings

## 6. Children's Privacy

Discloser is not intended for children under 17. We do not knowingly collect personal information from children under 17.

## 7. Data Retention

- **Your Data**: Retained until you delete your account
- **Share Links**: Automatically expire based on your settings
- **Analytics**: Retained anonymously for app improvement

## 8. Contact Us

For questions about this Privacy Policy or your data:
- Email: hello@discloser.app
- Website: https://discloser.app
```

**Create file:** `web/terms.md`

```markdown
---
title: Terms of Service
---

# Terms of Service

Last Updated: January 20, 2026

## 1. Acceptance of Terms

By downloading and using Discloser, you agree to these Terms of Service.

## 2. Use of the App

**Discloser is for informational purposes only** and does not constitute medical advice.

## 3. User Responsibilities

- You are responsible for the accuracy of information you provide
- You must be at least 17 years old to use this app
- You must not use the app for illegal purposes
- You are responsible for maintaining the security of your account

## 4. Health Information Disclaimer

- Test results should be verified with your healthcare provider
- Discloser is not a substitute for professional medical advice
- We make no representations about the accuracy of test results

## 5. Privacy and Data

Your use of Discloser is also governed by our Privacy Policy, available at:
https://discloser.app/privacy

## 6. Sharing Features

- Share links you create are your responsibility
- You control who receives your share links
- We are not responsible for unauthorized access to shared links

## 7. Limitation of Liability

Discloser is provided "as is" without warranties of any kind.

## 8. Termination

We reserve the right to suspend or terminate your access at any time.

## 9. Changes to Terms

We may update these Terms from time to time. Continued use of the app constitutes acceptance of changes.

## 10. Contact Us

For questions about these Terms:
- Email: hello@discloser.app
- Website: https://discloser.app
```

**Acceptance Criteria:** Legal documents are comprehensive and accurate

---

#### STEP 5.5: Add Legal Pages to Web App

**Commands:**
```bash
# Move legal files to web app
mv web/privacy.md web/app/privacy.md
mv web/terms.md web/app/terms.md
```

**Edit:** `web/app/page.tsx`
Add to footer section:
```tsx
<div className="flex gap-6 text-sm text-white/40">
  <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy</a>
  <a href="/terms" className="hover:text-white/60 transition-colors">Terms</a>
  <a href="mailto:hello@discloser.app" className="hover:text-white/60 transition-colors">Contact</a>
</div>
```

**Acceptance Criteria:** Legal pages accessible at `/privacy` and `/terms`

---

#### STEP 5.6: Configure App Store Connect

**Procedure:**

1. **Log in to App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Sign in with Apple Developer account

2. **Create App (if not exists)**
   - My Apps → +
   - Platform: iOS
   - Bundle ID: com.discloser-ios.app
   - Name: Discloser
   - SKU: DISCLOSER-001
   - Primary Language: English (U.S.)

3. **Upload Screenshots**
   - Go to App Information → Screenshots
   - Upload all created screenshots
   - Verify all sizes uploaded

4. **Upload App Icon**
   - Upload 1024x1024 icon
   - Preview to verify

5. **Enter Metadata**
   - Copy content from `assets/app-store-metadata.txt`
   - Enter in App Store Connect fields

6. **Configure Pricing**
   - Price: Free
   - Availability: All countries

7. **Age Rating**
   - Complete age rating questionnaire
   - Medical/Health information category
   - No violence, no sexual content

**Acceptance Criteria:** All App Store metadata complete

---

### 📍 RESUME POINT 6: START DAY 6 (After completing Day 5)

### DAY 6: Final Testing & Launch Prep

**Goal:** Ready for beta testers

#### STEP 6.1: Final Testing on TestFlight Build

**Procedure:**

1. **Run Full BETA_TESTING.md Checklist**
   - Open `BETA_TESTING.md`
   - Complete all checklist items on TestFlight build
   - Mark completed items

2. **Specific TestFlight Considerations**
   - [ ] Push notifications (may be limited in TestFlight)
   - [ ] Calendar integration
   - [ ] Deep linking
   - [ ] Background app refresh

3. **Compare TestFlight vs Dev**
   - [ ] Any performance differences?
   - [ ] Any UI differences?
   - [ ] Any feature regressions?

**Acceptance Criteria:** All BETA_TESTING.md items verified

---

#### STEP 6.2: Create Bug Tracking Template

**Create file:** `beta-bug-tracker.csv`

```
ID,Feature,Description,Severity,Steps to Reproduce,Device,iOS Version,Status,Fixed In Version
1,Authentication,Apple Sign-In fails occasionally,Critical,1. Tap Sign in with Apple 2. Enter credentials 3. Verify auth completes,iPhone 13,17.2,Open,
2,Sharing,Share link doesn't expire after set time,High,1. Create share link 2. Set 1 hour expiry 3. Wait 1 hour 4. Open link 5. Verify expired,iPhone 14 Pro,17.3,Open,
```

**Acceptance Criteria:** Bug tracker created and ready for feedback

---

#### STEP 6.3: Prepare Beta Invite List

**Create file:** `beta-testers.csv`

```
Name,Email,Device,Invited Date,Status
John Doe,john@example.com,iPhone 14 Pro,,Pending
Jane Smith,jane@example.com,iPhone 13,,Pending
```

**Acceptance Criteria:** Tester list created

---

#### STEP 6.4: Final Code Review

**Procedure:**

1. **Review Recent Changes**
```bash
git log --oneline -10
```

2. **Check for:**
   - [ ] Any TODO comments left in code?
   - [ ] Any console.log statements?
   - [ ] Any debug code?
   - [ ] Any commented-out code blocks?

3. **Clean Up**
```bash
# Remove console.logs (except error logging)
# Remove debug code
# Remove commented code

# Commit cleanup
git add .
git commit -m "Cleanup: Remove debug code and console.logs"
```

**Acceptance Criteria:** Code is clean and production-ready

---

### 📍 RESUME POINT 7: START DAY 7 (After completing Day 6)

### DAY 7: Beta Launch

**Goal:** Testers are using app and providing feedback

#### STEP 7.1: Submit to TestFlight Review

**Procedure:**

1. **Final Build Check**
```bash
# Increment build number to 20
# Edit app.json: "buildNumber": "20"

# Commit
git add app.json
git commit -m "Bump build number to 20 for beta launch"
```

2. **Create Final Build**
```bash
eas build --platform ios --profile preview
```

3. **Submit for Review**
   - Go to App Store Connect
   - TestFlight → Discloser
   - Add the new build
   - Answer questions:
     - Distribution: TestFlight
     - Expiration: 90 days
     - External Testing: Yes
   - Submit for review

4. **Wait for Review**
   - Review time: 1-3 days
   - Monitor status in App Store Connect

**Acceptance Criteria:** Build submitted for TestFlight review

---

#### STEP 7.2: Add Testers to TestFlight

**Procedure:**

1. **When Review Approved**
   - Go to TestFlight → Discloser
   - TestFlight Users → +

2. **Add Testers**
   - Import CSV from `beta-testers.csv`
   - Or add manually
   - Send invitations

3. **Monitor Invitations**
   - Track who accepted
   - Resend to non-responders after 24 hours

**Acceptance Criteria:** Testers invited to TestFlight

---

#### STEP 7.3: Create Beta Testing Guide

**Send to testers:**

**Subject:** Discloser Beta Testing - Welcome!

**Body:**
```
Hi [Name],

Thanks for joining the Discloser beta! Here's everything you need to know.

## What to Test

We've prepared a comprehensive testing guide with specific tasks:
1. Authentication (Apple, Google, Magic Link)
2. Upload test results (PDF or manual entry)
3. Share features (create links, test expiry, view limits)
4. Reminders and calendar integration
5. Settings and profile management

See the full guide attached: BETA_TESTING.md

## How to Report Bugs

Please include:
1. What you did (steps to reproduce)
2. What happened (the bug/error)
3. What you expected (what should have happened)
4. Screenshot (if applicable)

Send bug reports to: hello@discloser.app

## Testing Period

Please test over the next 7 days and report any issues you find.

## What We're Looking For

- Crashes or app freezes
- Confusing buttons or labels
- Features that don't work as expected
- Anything that feels awkward or slow

## Known Limitations

- Push notifications may be limited in TestFlight
- Some features require network connectivity
- Document parsing works best with clear PDFs

Thank you for helping us improve Discloser!

Be adventurous. Stay anonymous.
- The Discloser Team
```

**Acceptance Criteria:** Beta guide created and ready to send

---

#### STEP 7.4: Code Freeze

**Procedure:**

1. **Create Release Branch**
```bash
git checkout -b ios-beta-v1.0
git push origin ios-beta-v1.0
```

2. **Document Release**
```bash
# Create release notes
cat > RELEASE_NOTES_v1.0.md << 'EOF'
# Discloser iOS v1.0 Beta

## Features
- Apple Sign-In authentication
- Google Sign-In authentication
- Magic Link authentication (email-based)
- Upload test results with AI-powered extraction
- Manual test result entry
- Create time-limited share links
- Create view-limited share links
- Share aggregated STI status
- Testing reminders with calendar integration
- Risk assessment questionnaire
- Known conditions tracking
- Dark mode support

## Known Issues
[List any known issues from beta testing]

## Device Support
- iPhone 8 and later
- iOS 17 and later

## TestFlight Notes
- Push notifications may be limited
- Full functionality requires network connectivity
EOF

git add RELEASE_NOTES_v1.0.md
git commit -m "Add release notes for v1.0 beta"
```

3. **Tag Release**
```bash
git tag -a v1.0-beta -m "iOS v1.0 beta release"
git push origin v1.0-beta
```

**Acceptance Criteria:** Release branch created and tagged

---

#### STEP 7.5: Post-Launch Monitoring

**Procedure:**

**Day 8-14: Monitor Feedback**

1. **Check Bug Tracker Daily**
   - Review `beta-bug-tracker.csv`
   - Prioritize bugs by severity

2. **Triage Bugs**
   - **Critical**: Fix immediately, new TestFlight build
   - **High**: Fix within 2 days
   - **Medium**: Fix within v1.0.1
   - **Low**: Consider for v1.1

3. **Communicate with Testers**
   - Send daily updates on bug fixes
   - Ask follow-up questions
   - Thank testers for feedback

4. **Prepare v1.0.1 Plan**
   - Collect all high/medium bugs
   - Plan fixes
   - Document in `.cursor-plans/v1.0.1-beta-fixes.md`

**Acceptance Criteria:** Feedback actively monitored and bugs tracked

---

## 🎯 SUMMARY CHECKLIST

**Before Starting:**
- [x] Real iOS device available
- [x] Apple Developer account ready
- [x] TestFlight access confirmed
- [ ] Bug tracker spreadsheet created

**After Day 1:**
- [x] TestFlight build created (v22)
- [x] All auth flows tested (Apple Sign-In, Magic Link)
- [x] All core features tested
- [x] Critical bugs identified and fixed (9 bugs fixed, 1 pending migration)

**After Day 2:**
- [ ] Edge cases tested
- [ ] Error messages reviewed and improved
- [ ] Accessibility tested

**After Day 3:**
- [ ] Loading indicators verified
- [ ] Performance tested
- [ ] UI polished

**After Day 4:**
- [ ] TestFlight build uploaded
- [ ] TestFlight build tested on real device

**After Day 5:**
- [ ] App Store screenshots created
- [ ] App icon verified
- [ ] App Store metadata written
- [ ] Legal documents created
- [ ] App Store Connect configured

**After Day 6:**
- [ ] BETA_TESTING.md checklist completed
- [ ] Bug tracker template created
- [ ] Beta tester list created
- [ ] Code cleaned and reviewed

**After Day 7:**
- [ ] Final build submitted for review
- [ ] Testers invited
- [ ] Beta guide sent to testers
- [ ] Release branch created and tagged

---

## 📁 FILES TO CREATE

1. `beta-bug-tracker.csv` - Bug tracking template
2. `beta-testers.csv` - Beta tester list
3. `assets/screenshots/` - App Store screenshots directory
4. `assets/app-store-metadata.txt` - App Store metadata
5. `web/app/privacy.md` - Privacy policy page
6. `web/app/terms.md` - Terms of service page
7. `RELEASE_NOTES_v1.0.md` - Release notes
8. `.cursor-plans/v1.0.1-beta-fixes.md` - Next iteration plan

---

## 📝 FILES TO MODIFY

1. `app.json` - Increment build numbers (18, 19, 20)
2. `web/app/page.tsx` - Add privacy/terms links
3. `BETA_TESTING.md` - Add test cases discovered during testing

---

## ⚠️ RISK MITIGATION

| Risk | What To Do |
|------|-----------|
| Build fails in EAS | Check `eas.json` configuration, verify credentials, try `expo prebuild --clean` |
| TestFlight takes > 3 days | Submit early (Day 4), contact Apple support if delayed |
| Critical bug found after launch | Create hotfix build, fast-track through TestFlight |
| App Store rejects submission | Follow guidelines carefully, prepare appeal documentation |
| Testers don't provide feedback | Send daily check-ins, make reporting easy, offer incentives |

---

## 🚀 QUICK COMMANDS REFERENCE

```bash
# Build TestFlight
eas build --platform ios --profile preview

# Build development
eas build --platform ios --profile development

# Run on simulator
npx expo run:ios

# Prebuild native projects
npx expo prebuild

# Clean prebuild
rm -rf ios android
npx expo prebuild --clean

# Commit changes
git add .
git commit -m "message"

# Create branch
git checkout -b branch-name

# Push to remote
git push origin branch-name

# Run tests
npm test

# Check logs
eas build:view [BUILD_ID]
```

---

## 📞 CONTACT & SUPPORT

- **Technical Issues**: Check Expo and Supabase docs
- **Apple Support**: https://developer.apple.com/support/
- **Expo Support**: https://expo.dev/support
- **Supabase Support**: https://supabase.com/support

---

## 📋 DAILY PROGRESS TRACKING

Copy this section to track progress each day:

**Day 1: __/__/____**
- Started: ______ AM/PM
- Completed: ______ AM/PM
- Bugs found: ______
- Bugs fixed: ______
- Notes: _____________________________

**Day 2: __/__/____**
- Started: ______ AM/PM
- Completed: ______ AM/PM
- Bugs found: ______
- Bugs fixed: ______
- Notes: _____________________________

**Day 3: __/__/____**
- Started: ______ AM/PM
- Completed: ______ AM/PM
- Bugs found: ______
- Bugs fixed: ______
- Notes: _____________________________

**Day 4: __/__/____**
- Started: ______ AM/PM
- Completed: ______ AM/PM
- Bugs found: ______
- Bugs fixed: ______
- Notes: _____________________________

**Day 5: __/__/____**
- Started: ______ AM/PM
- Completed: ______ AM/PM
- Bugs found: ______
- Bugs fixed: ______
- Notes: _____________________________

**Day 6: __/__/____**
- Started: ______ AM/PM
- Completed: ______ AM/PM
- Bugs found: ______
- Bugs fixed: ______
- Notes: _____________________________

**Day 7: __/__/____**
- Started: ______ AM/PM
- Completed: ______ AM/PM
- Bugs found: ______
- Bugs fixed: ______
- Notes: _____________________________

---

**🎉 GOOD LUCK! YOU'VE GOT THIS!**

**Remember:**
- Start each day at the "Resume Point"
- Update progress tracking daily
- Don't hesitate to reach out for help
- Focus on critical bugs first
- Test on real device, not just simulator

**📱 Be adventurous. Stay anonymous.**
