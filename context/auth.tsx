import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter, useSegments } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  devBypass: () => void;
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
    if (Platform.OS !== "ios") return;

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken) {
      await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const devBypass = () => {
    if (__DEV__) {
      setSession({ user: { id: "dev-user", email: "dev@test.com" } } as Session);
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, signInWithApple, signOut, devBypass }}>
      {children}
    </AuthContext.Provider>
  );
}
