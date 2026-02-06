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
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
