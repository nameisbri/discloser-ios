import { Redirect } from "expo-router";
import { useAuth } from "../context/auth";
import { View, ActivityIndicator, SafeAreaView } from "react-native";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#923D5C" />
      </SafeAreaView>
    );
  }

  return <Redirect href={session ? "/dashboard" : "/login"} />;
}
