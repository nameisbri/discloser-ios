import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter, useSegments } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform, Alert } from "react-native";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  devBypass: () => Promise<void>;
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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) router.replace("/login");
    else if (session && inAuthGroup) router.replace("/dashboard");
  }, [session, loading, segments]);

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
        Alert.alert("Error", "Failed to get identity token from Apple");
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) {
        console.error("Apple Sign In error:", error);
        Alert.alert("Sign In Failed", error.message || "Failed to sign in with Apple. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Apple Sign In error:", error);

      // Handle user cancellation gracefully
      if (error && typeof error === "object" && "code" in error && error.code === "ERR_REQUEST_CANCELED") {
        return;
      }

      const message = error instanceof Error ? error.message : "An error occurred while signing in. Please try again.";
      Alert.alert("Sign In Failed", message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const devBypass = async () => {
    // Use Supabase anonymous auth for testing
    // Enable "Allow anonymous sign-ins" in Supabase Auth settings
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonymous sign-in failed:", error.message);
      Alert.alert(
        "Sign In Failed",
        error.message.includes("Anonymous sign-ins are disabled")
          ? "Anonymous sign-ins are disabled. Please enable them in Supabase Dashboard > Auth > Providers"
          : error.message || "Failed to sign in anonymously. Please try again."
      );
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, signInWithApple, signOut, devBypass }}>
      {children}
    </AuthContext.Provider>
  );
}
