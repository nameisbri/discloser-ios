import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ResultDetail() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white p-6 items-center justify-center">
      <Text className="text-gray-500">Result {id} detail coming soon</Text>
    </View>
  );
}
