import { useEffect } from "react";
import { Stack } from "expo-router";
import { useTheme } from "../../context/theme";
import { syncReminderNotifications } from "../../lib/notifications";

export default function ProtectedLayout() {
  const { isDark } = useTheme();

  // Sync notifications on app launch to handle TestFlight updates
  // that may have cleared scheduled notifications
  useEffect(() => {
    syncReminderNotifications();
  }, []);

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
