# Development Tasks

## In Progress

### Android Support & Multi-Auth
- [ ] Verify Android build configuration (app.json, eas.json)
- [ ] Test all features on Android devices/emulators
- [ ] Test Google Sign-In native flow on Android
- [ ] Test Magic Link flow on Android
- [ ] Verify push notifications work on Android (FCM)
- [ ] Verify calendar integration works on Android
- [ ] Create dedicated auth callback screen (`app/(auth)/auth-callback.tsx`)
- [ ] Document Android development setup

---

## Post-MVP Features

### Document Processing
- [ ] Add PDF upload support with proper conversion to images for OCR
- [ ] Support multi-page PDFs (extract all pages, not just first)
- [ ] Improve OCR accuracy for low-quality images
- [ ] Add image-based document parsing (currently only PDF text extraction works)

### Future Enhancements
- [ ] Batch upload multiple test results at once
- [ ] Export test history as PDF report
- [ ] Account linking between different OAuth providers
- [ ] Biometric authentication (Face ID / fingerprint unlock)
- [ ] Offline mode with sync when online
- [ ] Web app for managing results on desktop