import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/theme";

/**
 * Magic link callback handler
 * This route catches the redirect from magic link emails.
 * The actual token handling happens in AuthProvider via the deep link listener.
 * This page just shows a loading state while the auth state updates.
 */
export default function AuthCallback() {
  const router = useRouter();
  const { isDark } = useTheme();

  useEffect(() => {
    // The AuthProvider's deep link handler will process the tokens
    // and update the session. Once that happens, the auth routing
    // logic will redirect to the appropriate screen.
    // This timeout is a fallback in case something goes wrong.
    const timeout = setTimeout(() => {
      router.replace("/");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View className={`flex-1 items-center justify-center ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <ActivityIndicator size="large" color={isDark ? "#FF2D7A" : "#923D5C"} />
      <Text className={`mt-4 font-inter-medium ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
        Signing you in...
      </Text>
    </View>
  );
}
