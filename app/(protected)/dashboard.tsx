import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/auth";
import { useTestResults, useSTIStatus } from "../../lib/hooks";
import { useReminders } from "../../lib/hooks";
import {
  Plus,
  Bell,
  Settings,
  FileText,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { StatusShareModal } from "../../components/StatusShareModal";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { LinearGradient } from "expo-linear-gradient";
import type { TestResult } from "../../lib/types";
import { useState, useCallback } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { results, loading, refetch } = useTestResults();
  const { nextReminder, refetch: refetchReminders } = useReminders();
  const { aggregatedStatus } = useSTIStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusShare, setShowStatusShare] = useState(false);

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchReminders();
    }, [refetch, refetchReminders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchReminders()]);
    setRefreshing(false);
  }, [refetch, refetchReminders]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#923D5C"
          />
        }
      >
        {/* Header with gradient accent */}
        <LinearGradient
          colors={["#923D5C", "#6B2D45"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 64, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Image
                source={require("../../assets/icon.png")}
                style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }}
              />
              <Text className="text-white/90 font-inter-bold text-lg">Discloser</Text>
            </View>
            <Link href="/settings" asChild>
              <Pressable className="bg-white/20 p-3 rounded-xl active:bg-white/30">
                <Settings size={20} color="white" />
              </Pressable>
            </Link>
          </View>

          <Text className="text-white/70 font-inter-medium mb-1">
            {getGreeting()} 👋
          </Text>
          <Text className="text-3xl font-inter-bold text-white mb-4">
            You're looking healthy
          </Text>

          {/* Status pill */}
          {results.length > 0 && results[0].status === "negative" && (
            <View className="flex-row items-center bg-white/20 self-start px-4 py-2 rounded-full">
              <ShieldCheck size={16} color="#10B981" />
              <Text className="text-white font-inter-semibold ml-2 text-sm">
                All clear on your last test
              </Text>
            </View>
          )}
        </LinearGradient>

        <View className="px-6 -mt-8">
          {/* Next Test Reminder Card */}
          <Card className="bg-background-card mb-6 shadow-lg">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-accent-soft rounded-2xl items-center justify-center mr-4">
                  <Bell size={24} color="#FF6B8A" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-light font-inter-medium text-sm mb-1">
                    Next checkup
                  </Text>
                  <Text className="text-text text-lg font-inter-bold">
                    {nextReminder
                      ? formatDate(nextReminder.next_date)
                      : "Set a reminder"}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push("/reminders")}
                className="bg-primary-muted px-4 py-2 rounded-xl"
              >
                <Text className="text-primary font-inter-semibold text-sm">
                  {nextReminder ? "Edit" : "Add"}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-4">
            <Link href="/upload" asChild>
              <Pressable className="flex-1 bg-primary py-5 rounded-2xl items-center active:opacity-90">
                <Plus size={24} color="white" />
                <Text className="text-white font-inter-bold mt-2">Add Result</Text>
              </Pressable>
            </Link>
            <Link href="/reminders" asChild>
              <Pressable className="flex-1 bg-background-card border-2 border-border py-5 rounded-2xl items-center active:bg-gray-50">
                <Sparkles size={24} color="#923D5C" />
                <Text className="text-primary font-inter-bold mt-2">Reminders</Text>
              </Pressable>
            </Link>
          </View>

          {/* Share Status Button */}
          {aggregatedStatus.length > 0 && (
            <Pressable
              onPress={() => setShowStatusShare(true)}
              className="bg-primary-light/50 border-2 border-primary/20 py-4 rounded-2xl flex-row items-center justify-center mb-8 active:bg-primary-light"
            >
              <Share2 size={20} color="#923D5C" />
              <Text className="text-primary font-inter-bold ml-2">Share My Status</Text>
            </Pressable>
          )}

          {/* Results Section */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-inter-bold text-text">
              Your Results
            </Text>
            {results.length > 0 && (
              <Text className="text-text-muted font-inter-medium">
                {results.length} total
              </Text>
            )}
          </View>

          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#923D5C" />
            </View>
          ) : results.length === 0 ? (
            <Card className="p-8 items-center justify-center border-2 border-dashed border-border bg-primary-muted/30 mb-8">
              <View className="w-16 h-16 bg-primary-light rounded-full items-center justify-center mb-4">
                <FileText size={32} color="#923D5C" />
              </View>
              <Text className="text-xl font-inter-bold text-text mb-2">
                No results yet
              </Text>
              <Text className="text-text-light font-inter-regular text-center mb-6 leading-5">
                Upload your first test result and take{"\n"}control of your sexual health 💪
              </Text>
              <Link href="/upload" asChild>
                <Pressable className="bg-primary px-8 py-3 rounded-full">
                  <Text className="text-white font-inter-bold">Get Started</Text>
                </Pressable>
              </Link>
            </Card>
          ) : (
            <View className="gap-3 mb-8">
              {results.slice(0, 5).map((result, index) => (
                <ResultCard key={result.id} result={result} index={index} />
              ))}
              {results.length > 5 && (
                <Pressable className="py-4 items-center bg-primary-muted rounded-2xl">
                  <Text className="text-primary font-inter-bold">
                    View All Results ({results.length})
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            onPress={signOut}
            className="mb-12 py-4 items-center"
          >
            <Text className="text-text-muted font-inter-medium">
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <StatusShareModal
        visible={showStatusShare}
        onClose={() => setShowStatusShare(false)}
      />
    </SafeAreaView>
  );
}

function ResultCard({ result, index }: { result: TestResult; index: number }) {
  const router = useRouter();

  const statusConfig = {
    negative: {
      bg: "bg-success-light",
      text: "text-success-dark",
      label: "All Clear ✓",
      icon: "#10B981",
    },
    positive: {
      bg: "bg-danger-light",
      text: "text-danger",
      label: "Positive",
      icon: "#EF4444",
    },
    pending: {
      bg: "bg-warning-light",
      text: "text-warning",
      label: "Pending",
      icon: "#F59E0B",
    },
  };

  const status = statusConfig[result.status];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Pressable
      onPress={() => router.push(`/results/${result.id}`)}
      className="active:scale-[0.98]"
      style={{ transform: [{ scale: 1 }] }}
    >
      <Card className="flex-row items-center bg-background-card">
        <View className={`w-12 h-12 ${status.bg} rounded-2xl items-center justify-center mr-4`}>
          <FileText size={22} color={status.icon} />
        </View>
        <View className="flex-1">
          <Text className="text-text font-inter-bold mb-1">
            {result.test_type}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-text-light text-sm font-inter-regular">
              {formatDate(result.test_date)}
            </Text>
            {result.is_verified && (
              <>
                <Text className="text-text-muted mx-2">•</Text>
                <ShieldCheck size={14} color="#10B981" />
              </>
            )}
          </View>
        </View>
        <View className={`${status.bg} px-3 py-1.5 rounded-full`}>
          <Text className={`${status.text} font-inter-bold text-xs`}>
            {status.label}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
