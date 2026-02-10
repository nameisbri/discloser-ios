import "../global.css";
import { Slot } from "expo-router";
import { AuthProvider } from "../context/auth";
import { ThemeProvider, useTheme } from "../context/theme";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider } from "posthog-react-native";
import type PostHog from "posthog-react-native";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import {
  initAnalytics,
  enableCapture,
  disableCapture,
  trackAppOpened,
} from "../lib/analytics";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark } = useTheme();

  return (
    <View className={`flex-1 ${isDark ? "dark" : ""}`}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [posthogClient, setPosthogClient] = useState<PostHog | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Initialize PostHog + ATT
  useEffect(() => {
    const setup = async () => {
      const client = initAnalytics();
      if (!client) return;
      setPosthogClient(client);

      const { status } = await requestTrackingPermissionsAsync();
      if (status === "granted") {
        enableCapture();
      } else {
        disableCapture();
      }
    };
    setup();
  }, []);

  // Track app_opened on launch and foreground
  useEffect(() => {
    trackAppOpened({ source: "direct" });

    const sub = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        trackAppOpened({ source: "direct" });
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const content = (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );

  if (posthogClient) {
    return (
      <PostHogProvider client={posthogClient} autocapture={false}>
        {content}
      </PostHogProvider>
    );
  }

  return content;
}
