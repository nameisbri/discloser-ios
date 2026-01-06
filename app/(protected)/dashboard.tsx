import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../context/auth";

export default function Dashboard() {
  const { signOut } = useAuth();

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-6">Your Results</Text>

      <View className="bg-gray-100 rounded-lg p-4 mb-4">
        <Text className="text-gray-500 text-center">No test results yet</Text>
        <Link href="/upload" asChild>
          <Pressable className="bg-black rounded-lg py-3 mt-4">
            <Text className="text-white text-center font-semibold">Upload Your First Result</Text>
          </Pressable>
        </Link>
      </View>

      <View className="flex-row gap-3 mt-4">
        <Link href="/reminders" asChild>
          <Pressable className="flex-1 bg-gray-100 rounded-lg py-4">
            <Text className="text-center">Reminders</Text>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable className="flex-1 bg-gray-100 rounded-lg py-4">
            <Text className="text-center">Settings</Text>
          </Pressable>
        </Link>
      </View>

      <Pressable onPress={signOut} className="mt-auto py-3">
        <Text className="text-red-500 text-center">Sign Out</Text>
      </Pressable>
    </View>
  );
}
