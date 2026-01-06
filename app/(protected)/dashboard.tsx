import { View, Text, Pressable, ScrollView, SafeAreaView } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../context/auth";
import {
  Plus,
  Bell,
  Settings,
  FileText,
  ChevronRight,
  LogOut,
} from "lucide-react-native";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";

export default function Dashboard() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-text-light font-inter-medium mb-1">
              Welcome back,
            </Text>
            <Text className="text-3xl font-inter-bold text-secondary-dark">
              Dashboard
            </Text>
          </View>
          <View className="flex-row gap-3">
            <Link href="/settings" asChild>
              <Pressable className="bg-white p-3 rounded-2xl shadow-sm border border-border active:bg-gray-50">
                <Settings size={20} color="#374151" />
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Next Test Reminder Card */}
        <Card className="bg-primary-light border-0 mb-8 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-primary-dark font-inter-semibold mb-1">
              Next Recommended Test
            </Text>
            <Text className="text-primary text-xl font-inter-bold">
              March 15, 2026
            </Text>
          </View>
          <View className="bg-white p-3 rounded-2xl">
            <Bell size={24} color="#923D5C" />
          </View>
        </Card>

        {/* Quick Actions */}
        <View className="flex-row gap-4 mb-8">
          <Link href="/upload" asChild>
            <Button
              label="Add Result"
              icon={<Plus size={20} color="white" />}
              className="flex-1"
            />
          </Link>
          <Link href="/reminders" asChild>
            <Button
              label="Reminders"
              variant="outline"
              icon={<Bell size={20} color="#923D5C" />}
              className="flex-1"
              textClassName="text-primary"
            />
          </Link>
        </View>

        <Text className="text-xl font-inter-bold text-secondary-dark mb-4">
          Recent Results
        </Text>

        <View className="gap-4 mb-8">
          {/* Empty State or List of Results */}
          <Card className="p-8 items-center justify-center border-dashed">
            <View className="bg-gray-50 p-4 rounded-full mb-4">
              <FileText size={32} color="#9CA3AF" />
            </View>
            <Text className="text-text font-inter-semibold mb-2">
              No results yet
            </Text>
            <Text className="text-text-light font-inter-regular text-center mb-6">
              Upload your first test result to securely manage and share it.
            </Text>
            <Link href="/upload" asChild>
              <Button
                label="Upload Now"
                variant="secondary"
                size="sm"
                className="px-8"
              />
            </Link>
          </Card>
        </View>

        <Button
          label="Sign Out"
          variant="ghost"
          icon={<LogOut size={18} color="#DC3545" />}
          onPress={signOut}
          className="mb-12 border border-danger/10"
          textClassName="text-danger"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
