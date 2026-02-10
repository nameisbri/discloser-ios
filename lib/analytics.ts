import PostHog from "posthog-react-native";
import { logger } from "./utils/logger";

// ── Event Property Types ───────────────────────────────────────
// One interface per event — compile-time safety against accidental PII/health data.

interface AppOpenedProps {
  source: "notification" | "direct" | "deeplink";
}

interface OnboardingCompletedProps {
  duration_seconds: number;
  auth_method: "apple" | "google" | "magic_link";
}

interface DocumentUploadStartedProps {
  upload_method: "camera" | "gallery" | "file";
}

interface DocumentUploadCompletedProps {
  success: boolean;
  processing_time_ms: number;
  confidence_score: number;
}

interface DocumentVerificationResultProps {
  checks_passed: number;
  total_checks: number;
  overall_status: string;
}

interface ResultDeletedProps {
  result_age_days: number;
}

interface ShareLinkCreatedProps {
  expiry_hours: number;
  max_views: number;
  has_qr_code: boolean;
}

interface ShareLinkOpenedProps {
  link_age_hours: number;
  view_number: number;
}

interface ShareLinkExpiredProps {
  expiry_reason: "time" | "views" | "manual";
  total_views: number;
}

interface ReminderSetProps {
  interval_days: number;
}

interface SettingsChangedProps {
  setting_name: string;
  new_value: string;
}

// ── State ──────────────────────────────────────────────────────
let posthogClient: PostHog | null = null;
let enabled = false;

// ── Init & Lifecycle ───────────────────────────────────────────

/**
 * Creates the PostHog client. Returns it for use with PostHogProvider.
 * Starts opted-out — call `enableCapture()` after ATT consent.
 */
export function initAnalytics(): PostHog | undefined {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!key) {
    logger.warn("PostHog key not configured — analytics disabled");
    return undefined;
  }
  try {
    const client = new PostHog(key, {
      host,
      // PRIVACY: disable ALL automatic capture
      captureAppLifecycleEvents: false,
      enableSessionReplay: false,
      // Opt out by default — enabled only after ATT consent
      defaultOptIn: false,
    });
    posthogClient = client;
    return client;
  } catch (e) {
    logger.warn("PostHog init failed", e);
    return undefined;
  }
}

/** Call after ATT permission is granted. */
export function enableCapture(): void {
  enabled = true;
  posthogClient?.optIn();
}

/** Call if ATT permission is denied. */
export function disableCapture(): void {
  enabled = false;
  posthogClient?.optOut();
}

/** Identify user by Supabase auth ID. No PII (name, email) passed. */
export function identifyUser(userId: string): void {
  if (!enabled || !posthogClient) return;
  try {
    posthogClient.identify(userId);
  } catch (e) {
    logger.warn("Analytics identify failed", e);
  }
}

/** Reset identity on sign-out. */
export function resetUser(): void {
  try {
    posthogClient?.reset();
  } catch (e) {
    logger.warn("Analytics reset failed", e);
  }
}

// ── Private capture helper ─────────────────────────────────────

function track(event: string, properties?: Record<string, string | number | boolean | null>): void {
  if (!enabled || !posthogClient) return;
  try {
    posthogClient.capture(event, properties);
  } catch (e) {
    logger.warn("Analytics capture failed", e);
  }
}

// ── Typed Track Functions (one per event) ──────────────────────

export const trackAppOpened = (p: AppOpenedProps): void => track("app_opened", { ...p });
export const trackOnboardingCompleted = (p: OnboardingCompletedProps): void => track("onboarding_completed", { ...p });
export const trackDocumentUploadStarted = (p: DocumentUploadStartedProps): void => track("document_upload_started", { ...p });
export const trackDocumentUploadCompleted = (p: DocumentUploadCompletedProps): void => track("document_upload_completed", { ...p });
export const trackDocumentVerificationResult = (p: DocumentVerificationResultProps): void => track("document_verification_result", { ...p });
export const trackResultDeleted = (p: ResultDeletedProps): void => track("result_deleted", { ...p });
export const trackShareLinkCreated = (p: ShareLinkCreatedProps): void => track("share_link_created", { ...p });
export const trackShareLinkOpened = (p: ShareLinkOpenedProps): void => track("share_link_opened", { ...p });
export const trackShareLinkExpired = (p: ShareLinkExpiredProps): void => track("share_link_expired", { ...p });
export const trackReminderSet = (p: ReminderSetProps): void => track("reminder_set", { ...p });
export const trackSettingsChanged = (p: SettingsChangedProps): void => track("settings_changed", { ...p });
