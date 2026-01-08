import { Stack } from "expo-router";
import { useTheme } from "../../context/theme";

export default function AuthLayout() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#0D0B0E' : '#FAFAFA' }
      }}
    />
  );
}
