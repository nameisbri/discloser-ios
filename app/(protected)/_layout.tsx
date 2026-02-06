import { useEffect } from "react";
import { Stack } from "expo-router";
import { useTheme } from "../../context/theme";
import { useAuth } from "../../context/auth";
import { syncReminderNotifications } from "../../lib/notifications";

export default function ProtectedLayout() {
  const { isDark } = useTheme();
  const { session } = useAuth();

  // Sync notifications when user session becomes available
  // This fixes the race condition where sync ran before auth was restored
  useEffect(() => {
    if (session?.user) {
      syncReminderNotifications();
    }
  }, [session?.user?.id]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#0D0B0E' : '#FAFAFA' }
      }}
    >
      {/* Main tabs group - dashboard, upload, settings */}
      <Stack.Screen name="(tabs)" />

      {/* Detail screens that push on top of tabs */}
      <Stack.Screen name="results/[id]" />
      <Stack.Screen name="reminders" />
    </Stack>
  );
}
