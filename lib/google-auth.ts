import { Platform } from "react-native";

// Lazy load Google Sign-In to avoid crashes in Expo Go
// The native module is only available in development/production builds
let GoogleSignin: any = null;
let isSuccessResponse: any = () => false;
let isErrorWithCode: any = () => false;
let statusCodes: any = {};

// Try to load the native module (will fail gracefully in Expo Go)
try {
  const googleSignIn = require("@react-native-google-signin/google-signin");
  GoogleSignin = googleSignIn.GoogleSignin;
  isSuccessResponse = googleSignIn.isSuccessResponse;
  isErrorWithCode = googleSignIn.isErrorWithCode;
  statusCodes = googleSignIn.statusCodes;
} catch {
  // Native module not available (Expo Go) - functions will return appropriate errors
  console.warn("Google Sign-In native module not available (expected in Expo Go)");
}

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let isConfigured = false;

export function configureGoogleSignIn() {
  if (isConfigured) return;

  if (!WEB_CLIENT_ID) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set. Please add it to your .env file."
    );
  }

  // Only configure native Google Sign-In for Android when module is available
  if (Platform.OS === "android" && GoogleSignin) {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }

  isConfigured = true;
}

export type GoogleSignInResult =
  | { success: true; idToken: string }
  | { success: false; cancelled: true }
  | { success: false; cancelled: false; error: Error };

export async function getGoogleIdToken(): Promise<GoogleSignInResult> {
  configureGoogleSignIn();

  // iOS uses Supabase OAuth flow directly (called from auth context)
  if (Platform.OS === "ios") {
    return {
      success: false,
      cancelled: false,
      error: new Error("Use Supabase OAuth flow for iOS"),
    };
  }

  // Android: Use native Google Sign-In
  if (!GoogleSignin) {
    return {
      success: false,
      cancelled: false,
      error: new Error("Google Sign-In not available in Expo Go. Use a development build."),
    };
  }

  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      const idToken = response.data.idToken;
      if (!idToken) {
        return {
          success: false,
          cancelled: false,
          error: new Error("No ID token received from Google"),
        };
      }
      return { success: true, idToken };
    }

    return {
      success: false,
      cancelled: false,
      error: new Error("Google Sign-In failed"),
    };
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
        case statusCodes.IN_PROGRESS:
          return { success: false, cancelled: true };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            cancelled: false,
            error: new Error(
              "Google Play Services not available. Please install or update Google Play Services."
            ),
          };
        default:
          return {
            success: false,
            cancelled: false,
            error: new Error(error.message || "Google Sign-In failed"),
          };
      }
    }

    return {
      success: false,
      cancelled: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    if (Platform.OS === "android" && GoogleSignin) {
      await GoogleSignin.signOut();
    }
  } catch {
    // Ignore sign out errors
  }
}
