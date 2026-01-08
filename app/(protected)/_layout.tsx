import { Stack } from "expo-router";
import { useTheme } from "../../context/theme";

export default function ProtectedLayout() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#0D0B0E' : '#FAFAFA' }
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="results/[id]" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
