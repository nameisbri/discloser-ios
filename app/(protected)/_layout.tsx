import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' }
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
