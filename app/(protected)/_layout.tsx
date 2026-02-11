import { Stack } from "expo-router";
import { useTheme } from "../../context/theme";
import { useScreenTracking } from "../../lib/hooks/useScreenTracking";

export default function ProtectedLayout() {
  const { isDark } = useTheme();
  useScreenTracking();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#0D0B0E' : '#FAFAFA' }
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
