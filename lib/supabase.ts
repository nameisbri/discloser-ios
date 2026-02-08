import * as SecureStore from "expo-secure-store";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./utils/logger";
import type { Database } from "./types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Secure storage adapter for Supabase auth tokens.
 * Uses expo-secure-store which encrypts data using the device's keychain (iOS)
 * or keystore (Android), providing secure storage for sensitive auth tokens.
 */
const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error("SecureStore getItem error", { key, error });
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error("SecureStore setItem error", { key, error });
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error("SecureStore removeItem error", { key, error });
    }
  },
};

function createSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error("Missing Supabase environment variables", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
    throw new Error(
      "Supabase configuration missing. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: secureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();

/**
 * Returns a valid access token, refreshing the session if expired or about to expire.
 * Use this instead of `supabase.auth.getSession()` when calling authenticated Edge Functions.
 * @throws Error if the user is not authenticated
 */
export async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated. Please sign in.");
  }

  // If token expires within 60 seconds, proactively refresh
  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  if (expiresAt > 0 && expiresAt - Date.now() < 60_000) {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    if (refreshed) {
      return refreshed.access_token;
    }
  }

  return session.access_token;
}
