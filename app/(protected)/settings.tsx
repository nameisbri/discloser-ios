import { View, Text, Pressable } from "react-native";
import { useAuth } from "../../context/auth";

export default function Settings() {
  const { signOut, session } = useAuth();

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-gray-500 mb-4">{session?.user?.email || "User"}</Text>

      <Pressable onPress={signOut} className="bg-red-500 rounded-lg py-3 mt-auto">
        <Text className="text-white text-center font-semibold">Sign Out</Text>
      </Pressable>
    </View>
  );
}
