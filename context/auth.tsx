import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter, useSegments } from "expo-router";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Platform, Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { getGoogleIdToken, signOutGoogle } from "../lib/google-auth";
import { logger } from "../lib/utils/logger";
import type { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const isRouting = useRef(false);

  // Handle deep links for magic link authentication
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes("access_token") || url.includes("refresh_token")) {
        try {
          // Parse tokens from URL hash
          const hashIndex = url.indexOf("#");
          if (hashIndex !== -1) {
            const hash = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");

            if (accessToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
              });
            }
          }
        } catch (error) {
          logger.error("Error handling magic link", { error });
        }
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened with a link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Don't reset onboardingChecked here - it causes multiple route changes
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inProtected = segments[0] === "(protected)";

    const checkOnboardingAndRoute = async () => {
      // Prevent multiple simultaneous route changes
      if (isRouting.current) return;
      isRouting.current = true;

      try {
        if (!session) {
          if (!inAuthGroup) router.replace("/login");
          return;
        }

        // User is logged in
        if (inAuthGroup) {
          // Just signed in - check if onboarding is complete
          const { data } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", session.user.id)
            .single() as { data: { onboarding_completed: boolean } | null };

          // Set onboardingChecked BEFORE navigating to prevent race condition
          // where segments change triggers effect again before state updates
          setOnboardingChecked(true);

          if (data?.onboarding_completed) {
            router.replace("/dashboard");
          } else {
            router.replace("/(onboarding)");
          }
          return;
        }

        // If in protected area, verify onboarding is complete
        if (inProtected && !onboardingChecked) {
          const { data } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", session.user.id)
            .single() as { data: { onboarding_completed: boolean } | null };

          if (!data?.onboarding_completed) {
            router.replace("/(onboarding)");
          }
          setOnboardingChecked(true);
        }
      } finally {
        isRouting.current = false;
      }
    };

    checkOnboardingAndRoute();
  }, [session, loading, segments, onboardingChecked]);

  const signInWithApple = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Error", "Apple Sign In is only available on iOS");
      return;
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert("Sign In Failed", "We couldn't verify your Apple ID. Please try signing in again.");
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) {
        logger.error("Apple Sign In error", { error });
        Alert.alert(
          "Sign In Failed",
          error.message || "We couldn't sign you in with Apple. Please check your internet connection and try again."
        );
      }
    } catch (error: unknown) {
      logger.error("Apple Sign In error", { error });

      // Handle user cancellation gracefully
      if (error && typeof error === "object" && "code" in error && error.code === "ERR_REQUEST_CANCELED") {
        return;
      }

      const message = error instanceof Error ? error.message : "We couldn't sign you in. Please check your internet connection and try again.";
      Alert.alert("Sign In Failed", message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === "ios") {
        // iOS: Use Supabase OAuth flow with browser
        WebBrowser.maybeCompleteAuthSession();
        const redirectUrl = Linking.createURL("auth/callback");

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          logger.error("Google Sign In error", { error });
          Alert.alert(
            "Sign In Failed",
            error.message || "We couldn't sign you in with Google. Please check your internet connection and try again."
          );
          return;
        }

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

          if (result.type === "success" && result.url) {
            // Extract the auth tokens from the URL
            const url = new URL(result.url);
            const params = new URLSearchParams(url.hash.substring(1)); // Remove the #
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");

            if (accessToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
              });

              if (sessionError) {
                logger.error("Session error", { error: sessionError });
                Alert.alert(
                  "Sign In Failed",
                  "We couldn't complete your sign in. Please close the app and try again. If the problem continues, check your internet connection."
                );
              }
            }
          }
        }
      } else {
        // Android: Use native Google Sign-In
        const result = await getGoogleIdToken();

        if (!result.success) {
          if (result.cancelled) return;
          Alert.alert("Sign In Failed", result.error.message);
          return;
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: result.idToken,
        });

        if (error) {
          logger.error("Google Sign In error", { error });
          Alert.alert(
            "Sign In Failed",
            error.message || "We couldn't sign you in with Google. Please check your internet connection and try again."
          );
        }
      }
    } catch (error) {
      logger.error("Google Sign In error", { error });
      const message = error instanceof Error ? error.message : "We couldn't sign you in. Please check your internet connection and try again.";
      Alert.alert("Sign In Failed", message);
    }
  };

  const signInWithMagicLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = Linking.createURL("auth/callback");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        logger.error("Magic link error", { error });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error("Magic link error", { error });
      const message = error instanceof Error ? error.message : "Failed to send magic link";
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await signOutGoogle();
    // Reset state when signing out to ensure clean state for next sign in
    setOnboardingChecked(false);
    isRouting.current = false;
  };

  return (
    <AuthContext.Provider value={{ session, loading, signInWithApple, signInWithGoogle, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
