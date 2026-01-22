# Edge Case Testing Guide - Day 2

**Date:** 2026-01-21
**Purpose:** Document edge cases discovered during Day 1 that require real device testing

---

## 🔍 Network & Connectivity

### Test 1: Poor Network Connection
**Setup:**
1. Enable Airplane Mode on device
2. Or use Network Link Conditioner (Settings → Developer → Network Link Conditioner)

**Test Cases:**
- [ ] **Sign In with Airplane Mode**
  - Try Apple Sign In
  - Expected: "We couldn't sign you in with Apple. Please check your internet connection and try again."
  - Verify: No app crash, clear error message

- [ ] **Upload Test Result with Poor Connection**
  - Start upload process
  - Enable Airplane Mode mid-upload
  - Expected: "We couldn't upload your test result. Please check your internet connection and try again..."
  - Verify: Can retry after re-enabling connection

- [ ] **Create Share Link with No Network**
  - Try to create share link offline
  - Expected: Clear network error with retry guidance
  - Turn on network and retry
  - Expected: Successfully creates link

- [ ] **Dashboard Load with Intermittent Connection**
  - Use Network Link Conditioner: 3G, High Latency
  - Navigate to dashboard
  - Expected: Shows loading state, then loads content or error
  - Verify: No infinite loading spinners

---

## 📱 App State & Backgrounding

### Test 2: App Backgrounding During Operations

**Test Cases:**
- [ ] **Background During Upload**
  1. Start uploading a test result
  2. Immediately press Home button
  3. Wait 10 seconds
  4. Reopen app
  - Expected: Upload either completed or shows clear error
  - Verify: No data corruption, can retry if failed

- [ ] **Background During Photo Selection**
  1. Tap "Choose from photos"
  2. Press Home button while picker is open
  3. Wait 5 seconds
  4. Reopen app
  - Expected: Returns to upload screen safely
  - Verify: Can try photo selection again

- [ ] **Background During Share Link Creation**
  1. Start creating a share link
  2. Press Home immediately
  3. Wait 5 seconds
  4. Reopen app
  - Expected: Either link created or can retry
  - Verify: No duplicate links created

- [ ] **Background During Magic Link Sign In**
  1. Request magic link email
  2. Press Home button
  3. Open email app, tap magic link
  - Expected: Opens app and signs in successfully
  - Verify: Session persists correctly

---

## 🔐 Authentication Edge Cases

### Test 3: Magic Link State Handling

**Test Cases:**
- [ ] **Open Magic Link While Logged Out**
  1. Sign out completely
  2. Open magic link from email
  - Expected: Signs in and navigates to dashboard
  - Verify: Session creates successfully

- [ ] **Open Magic Link While Logged In (Same Account)**
  1. Already signed in
  2. Open magic link for same email
  - Expected: Already signed in, navigates to dashboard
  - Verify: No error, seamless experience

- [ ] **Open Magic Link While Logged In (Different Account)**
  1. Signed in as user A
  2. Open magic link for user B
  - Expected: Shows clear message about account mismatch
  - Verify: Doesn't force sign out without consent

- [ ] **Open Expired Magic Link**
  1. Request magic link
  2. Wait 1+ hour (or manually expire in DB)
  3. Try to use link
  - Expected: Clear "This link has expired" message
  - Verify: Can request new link easily

- [ ] **Use Same Magic Link Twice**
  1. Request magic link
  2. Open link once (signs in)
  3. Sign out
  4. Try to use same link again
  - Expected: Link should be invalidated, request new one
  - Verify: Security maintained

---

## 📄 Document Parsing Edge Cases

### Test 4: Problematic Documents

**Test Cases:**
- [ ] **Upload Corrupted PDF**
  - Use intentionally corrupted file
  - Expected: "Auto-extraction Failed" with clear message
  - Verify: Can proceed with manual entry

- [ ] **Upload Non-Medical Image**
  - Upload screenshot, meme, random photo
  - Expected: Parsing fails gracefully
  - Message: "Please enter manually."
  - Verify: Doesn't crash, can use manual entry

- [ ] **Upload Very Large File (>10MB)**
  - Try to upload large document
  - Expected: Either processes or shows size limit error
  - Verify: App doesn't freeze or crash

- [ ] **Upload Scanned/Low Quality Image**
  - Use blurry photo of test result
  - Expected: Parsing may fail or extract partial data
  - Verify: User can correct extracted data manually

- [ ] **Upload Non-English Test Result**
  - Upload French, Spanish, or other language result
  - Expected: Parsing likely fails gracefully
  - Verify: Manual entry still works

---

## 🔗 Share Link Edge Cases

### Test 5: Share Link Expiry & Limits

**Test Cases:**
- [ ] **Create Link That Expires in 1 Minute**
  1. Create share link with 5-minute expiry (shortest duration)
  2. Copy link
  3. Wait 5 minutes
  4. Open link in Safari
  - Expected: Shows "This link vanished" error page
  - Verify: Clean error UI, no data leak

- [ ] **Create Link with 1 View Limit**
  1. Create link with max_views = 1
  2. Open link once (counts as 1 view)
  3. Try to open again in new tab
  - Expected: "That's a wrap" (max views reached)
  - Verify: View counter incremented correctly

- [ ] **Test View Limit Edge: Simultaneous Opens**
  1. Create link with max_views = 3
  2. Open link in 5 different tabs simultaneously
  - Expected: First 3 succeed, rest fail
  - Verify: Race condition handled properly

- [ ] **Share Link with Name Toggle**
  1. Create link with "Show my name" ON
  2. Open in Safari
  - Expected: Shows "Shared by [Name]"
  3. Create another with "Show my name" OFF
  4. Open in Safari
  - Expected: No name shown
  - Verify: Privacy respected correctly

---

## 🔔 Notifications & Permissions

### Test 6: Permission Handling

**Test Cases:**
- [ ] **Deny Camera Permission Initially**
  1. Tap "Take a photo"
  2. Deny permission when prompted
  - Expected: Alert with explanation and Settings guidance
  - Verify: Can retry after enabling in Settings

- [ ] **Deny Photo Library Permission**
  1. Tap "Choose from photos"
  2. Deny permission
  - Expected: Clear message with how to enable
  - Verify: Provides actionable next steps

- [ ] **Deny Notification Permission**
  1. Create reminder
  2. Tap "Add to Calendar"
  - Expected: Calendar opens with event pre-filled
  - Verify: Works without notification permission

- [ ] **Enable Notification Permission Later**
  1. Initially deny notifications
  2. Create reminder (no notifications)
  3. Go to Settings → Enable notifications
  4. Create another reminder
  - Expected: New reminder schedules notification
  - Verify: Permission change detected

---

## 📊 Data Edge Cases

### Test 7: Duplicate & Conflicting Data

**Test Cases:**
- [ ] **Add Test Result with Duplicate Date**
  1. Create test result for date "2026-01-15"
  2. Try to create another for same date
  - Expected: Alert asking "Add another result for this date?"
  - Options: Cancel or Add Anyway
  - Verify: User has control, no silent override

- [ ] **Delete Test Result with Active Share Links**
  1. Create test result
  2. Create share link for it
  3. Try to delete the test result
  - Expected: Warning about active share links?
  - Verify: Deletion behavior is clear

- [ ] **Create Multiple Reminders with Same Date**
  1. Create reminder for "2026-02-01"
  2. Create another for same date
  - Expected: Both should be allowed
  - Verify: Both show in list, no conflict

---

## 🎨 UI/UX Edge Cases

### Test 8: Keyboard & Input Handling

**Test Cases:**
- [ ] **Keyboard Covers Input Field (Login)**
  1. Go to login screen
  2. Tap email input for Magic Link
  - Expected: KeyboardAvoidingView pushes content up
  - Verify: Input field visible, can type without obstruction

- [ ] **Keyboard During Upload Details Entry**
  1. Go to Upload → Details step
  2. Tap "Notes" text area
  - Expected: Keyboard appears, content scrolls
  - Verify: Can see what you're typing

- [ ] **Very Long Input Text**
  - Enter 500+ characters in Notes field
  - Expected: Text area expands or scrolls
  - Verify: No text cutoff, saves successfully

- [ ] **Special Characters in Profile Fields**
  - Use emojis, accents, special chars in name/alias
  - Expected: Accepts and displays correctly
  - Verify: No encoding issues

---

## 🔄 Refresh & Sync Edge Cases

### Test 9: Data Synchronization

**Test Cases:**
- [ ] **Pull to Refresh on Dashboard**
  1. Have test results loaded
  2. Delete one via Supabase dashboard (external)
  3. Pull to refresh in app
  - Expected: Deleted result disappears
  - Verify: Sync works correctly

- [ ] **Create Share Link on Web, View in App**
  - If web interface exists for share links
  - Create link via web
  - Check app
  - Expected: Shows new link after refresh

- [ ] **Sign In on Two Devices**
  1. Sign in on Device A
  2. Upload test result on Device A
  3. Sign in on Device B (same account)
  - Expected: Device B sees all data from Device A
  - Verify: Data syncs across devices

---

## 🚨 Error Recovery

### Test 10: Recovering from Errors

**Test Cases:**
- [ ] **Recover from Network Error**
  1. Go offline
  2. Try to create share link (fails)
  3. Go back online
  4. Retry same action
  - Expected: Works on retry
  - Verify: No corrupt state from previous failure

- [ ] **Recover from Auth Error**
  1. Sign in
  2. Manually invalidate session in Supabase
  3. Try to create test result
  - Expected: Error or auto-redirect to login
  - Verify: Graceful handling, no crash

- [ ] **Retry After Upload Failure**
  1. Start upload with poor connection
  2. Upload fails
  3. Fix connection
  4. Tap "Save it" again
  - Expected: Retries upload successfully
  - Verify: No need to re-enter data

---

## 📋 Testing Checklist Summary

**Quick Reference for Physical Device Testing:**

### Must Test on Real Device:
- ✅ All authentication flows (Apple, Google, Magic Link)
- ✅ Camera and photo library permissions
- ✅ Notification permissions
- ✅ App backgrounding and foregrounding
- ✅ Network connection changes (Airplane mode)
- ✅ Share link viewing in Safari (external browser)
- ✅ Calendar integration
- ✅ Deep linking (magic link callback)

### Can Test on Simulator:
- ❌ Push notifications (limited)
- ✓ UI/UX testing
- ✓ Form validation
- ✓ Navigation flows
- ✓ Data CRUD operations

---

## 🐛 Bug Reporting Template

When you find an edge case bug during testing, document it like this:

```
**Bug ID:** EDGE-XXX
**Feature:** [Authentication/Upload/Sharing/etc.]
**Description:** [What went wrong]
**Severity:** Critical/High/Medium/Low

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]

**Device Info:**
- Device: [iPhone model]
- iOS Version: [17.x]
- App Build: [v22]
- Network: [WiFi/Cellular/Offline]

**Screenshots:** [Attach if applicable]
```

---

## 🎯 Priority for Day 2

**Test in this order:**

1. **Network edge cases** (most critical for user experience)
2. **App backgrounding** (common user behavior)
3. **Auth edge cases** (security implications)
4. **Document parsing edge cases** (core feature)
5. **Share link edge cases** (privacy implications)
6. **UI/keyboard issues** (polish)

**Estimated Time:** 3-4 hours of focused device testing

---

**🔄 Update this document as you discover new edge cases during testing!**
