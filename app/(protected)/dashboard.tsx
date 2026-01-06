import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../context/auth";
import { useTestResults } from "../../lib/hooks";
import { useReminders } from "../../lib/hooks";
import {
  Plus,
  Bell,
  Settings,
  FileText,
  ChevronRight,
  LogOut,
  Calendar,
  ShieldCheck,
} from "lucide-react-native";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import type { TestResult } from "../../lib/types";
import { useState, useCallback } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { results, loading, refetch } = useTestResults();
  const { nextReminder } = useReminders();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#923D5C"
          />
        }
      >
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
              {nextReminder
                ? formatDate(nextReminder.next_date)
                : "No reminder set"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/reminders")}
            className="bg-white p-3 rounded-2xl"
          >
            <Bell size={24} color="#923D5C" />
          </Pressable>
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

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#923D5C" />
          </View>
        ) : results.length === 0 ? (
          <Card className="p-8 items-center justify-center border-dashed mb-8">
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
        ) : (
          <View className="gap-4 mb-8">
            {results.slice(0, 5).map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
            {results.length > 5 && (
              <Pressable className="py-3 items-center">
                <Text className="text-primary font-inter-semibold">
                  View All Results ({results.length})
                </Text>
              </Pressable>
            )}
          </View>
        )}

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

function ResultCard({ result }: { result: TestResult }) {
  const router = useRouter();

  const statusVariant =
    result.status === "negative"
      ? "success"
      : result.status === "positive"
      ? "danger"
      : "warning";

  const statusLabel =
    result.status.charAt(0).toUpperCase() + result.status.slice(1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Pressable onPress={() => router.push(`/results/${result.id}`)}>
      <Card className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-text font-inter-semibold mb-1">
            {result.test_type}
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Calendar size={14} color="#6B7280" />
              <Text className="text-text-light text-sm font-inter-regular ml-1">
                {formatDate(result.test_date)}
              </Text>
            </View>
            {result.is_verified && (
              <View className="flex-row items-center">
                <ShieldCheck size={14} color="#28A745" />
                <Text className="text-success text-sm font-inter-medium ml-1">
                  Verified
                </Text>
              </View>
            )}
          </View>
        </View>
        <Badge label={statusLabel} variant={statusVariant} />
        <ChevronRight size={20} color="#E0E0E0" className="ml-3" />
      </Card>
    </Pressable>
  );
}
