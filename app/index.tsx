import { Redirect } from "expo-router";
import { useAuth } from "../context/auth";
import { useTheme } from "../context/theme";
import { View, ActivityIndicator, SafeAreaView } from "react-native";

export default function Index() {
  const { session, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? "bg-dark-bg" : "bg-background"}`}>
        <ActivityIndicator size="large" color={isDark ? "#FF2D7A" : "#923D5C"} />
      </SafeAreaView>
    );
  }

  return <Redirect href={session ? "/dashboard" : "/login"} />;
}
