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
import { useTheme } from "../../context/theme";
import { useTestResults, useSTIStatus, useProfile, useTestingRecommendations, formatDueMessage } from "../../lib/hooks";
import { useReminders } from "../../lib/hooks";
import {
  Plus,
  Bell,
  Settings,
  FileText,
  Share2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from "lucide-react-native";
import { StatusShareModal } from "../../components/StatusShareModal";
import { RiskAssessment } from "../../components/RiskAssessment";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { LinearGradient } from "expo-linear-gradient";
import type { TestResult } from "../../lib/types";
import { useState, useCallback } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { isDark } = useTheme();
  const { results, loading, refetch } = useTestResults();
  const { nextReminder, overdueReminder, activeReminders, refetch: refetchReminders } = useReminders();
  const { routineStatus, knownConditionsStatus } = useSTIStatus();
  const { profile, refetch: refetchProfile, updateRiskLevel, hasKnownCondition } = useProfile();
  const recommendation = useTestingRecommendations(results);
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusShare, setShowStatusShare] = useState(false);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchReminders();
      refetchProfile();
    }, [refetch, refetchReminders, refetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchReminders(), refetchProfile()]);
    setRefreshing(false);
  }, [refetch, refetchReminders, refetchProfile]);

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD without timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Rise and shine";
    if (hour < 18) return "Hey there";
    return "Evening, you";
  };

  // Dark mode gradient colors
  const gradientColors: [string, string] = isDark
    ? ["#1A1520", "#2D2438"]
    : ["#923D5C", "#6B2D45"];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#FF2D7A" : "#923D5C"}
          />
        }
      >
        {/* Header with gradient accent */}
        <LinearGradient
          colors={gradientColors}
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
              <Pressable className={`p-3 rounded-xl active:opacity-80 ${isDark ? "bg-dark-accent/20" : "bg-white/20"}`}>
                <Settings size={20} color="white" />
              </Pressable>
            </Link>
          </View>

          <Text className="text-white/70 font-inter-medium mb-1">
            {getGreeting()} 👋
          </Text>
          <Text className="text-3xl font-inter-bold text-white mb-4">
            Looking good out there
          </Text>

          {/* Status pill - based on routine tests only */}
          {routineStatus.length > 0 && routineStatus.every((s) => s.status === "negative") && (
            <View className={`flex-row items-center self-start px-4 py-2 rounded-full ${isDark ? "bg-dark-mint/20" : "bg-white/20"}`}>
              <ShieldCheck size={16} color={isDark ? "#00E5A0" : "#10B981"} />
              <Text className="text-white font-inter-semibold ml-2 text-sm">
                All clear. Go be adventurous.
              </Text>
            </View>
          )}
        </LinearGradient>

        <View className="px-6 -mt-8">
          {/* Next Test Reminder Card - use recommendation (based on routine tests) not reminder table */}
          {recommendation.isOverdue && recommendation.nextDueDate ? (
            <View
              className={`mb-6 shadow-lg rounded-2xl p-5 border-2 ${isDark ? "bg-dark-danger-bg border-danger" : "border-danger"}`}
              style={{ backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2" }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-danger/30" : "bg-red-200"}`}
                  >
                    <Bell size={24} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-danger font-inter-medium text-sm mb-1">
                      Overdue
                    </Text>
                    <Text className="text-lg font-inter-bold text-danger">
                      {formatDate(recommendation.nextDueDate)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push("/reminders")}
                  className={`px-4 py-2 rounded-xl ${isDark ? "bg-danger/30" : "bg-red-200"}`}
                >
                  <Text className="font-inter-semibold text-sm text-danger">Edit</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Card className="mb-6 shadow-lg">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-dark-coral/20" : "bg-accent-soft"}`}>
                    <Bell size={24} color={isDark ? "#FF6B8A" : "#FF6B8A"} />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-inter-medium text-sm mb-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                      Next checkup
                    </Text>
                    <Text className={`text-lg font-inter-bold ${isDark ? "text-dark-text" : "text-text"}`}>
                      {nextReminder
                        ? formatDate(nextReminder.next_date)
                        : "Set a reminder"}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push("/reminders")}
                  className={`px-4 py-2 rounded-xl ${isDark ? "bg-dark-accent-muted" : "bg-primary-muted"}`}
                >
                  <Text className={`font-inter-semibold text-sm ${isDark ? "text-dark-accent" : "text-primary"}`}>
                    {nextReminder ? "Edit" : "Add"}
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-4">
            <Link href="/upload" asChild>
              <Pressable className={`flex-1 py-5 rounded-2xl items-center active:opacity-90 ${isDark ? "bg-dark-accent" : "bg-primary"}`}>
                <Plus size={24} color="white" />
                <Text className="text-white font-inter-bold mt-2">Add Result</Text>
              </Pressable>
            </Link>
            <Link href="/reminders" asChild>
              <Pressable className={`flex-1 border-2 py-5 rounded-2xl items-center ${isDark ? "bg-dark-surface border-dark-border active:bg-dark-surface-light" : "bg-background-card border-border active:bg-gray-50"}`}>
                <Sparkles size={24} color={isDark ? "#FF2D7A" : "#923D5C"} />
                <Text className={`font-inter-bold mt-2 ${isDark ? "text-dark-accent" : "text-primary"}`}>Reminders</Text>
              </Pressable>
            </Link>
          </View>

          {/* No Reminders Prompt */}
          {!overdueReminder && activeReminders.length === 0 && results.length > 0 && (
            <Pressable
              onPress={() => router.push("/reminders")}
              className={`border-2 py-4 rounded-2xl flex-row items-center justify-center mb-4 ${
                isDark
                  ? "bg-dark-coral/10 border-dark-coral/30 active:bg-dark-coral/20"
                  : "bg-accent-soft/50 border-accent/30 active:bg-accent-soft"
              }`}
            >
              <Bell size={20} color={isDark ? "#FF6B8A" : "#FF6B8A"} />
              <Text className={`font-inter-bold ml-2 ${isDark ? "text-dark-coral" : "text-accent-dark"}`}>
                Stay on top of it
              </Text>
            </Pressable>
          )}

          {/* Testing Overdue - Small inline warning */}
          {(recommendation.isOverdue || recommendation.isDueSoon) && (
            <View className="flex-row items-center justify-center mb-4">
              <AlertTriangle size={14} color="#F59E0B" />
              <Text className={`font-inter-medium text-xs ml-1.5 ${isDark ? "text-dark-warning" : "text-warning-dark"}`}>
                {formatDueMessage(recommendation)}
              </Text>
            </View>
          )}

          {/* Risk Assessment Prompt */}
          {!profile?.risk_level && results.length > 0 && (
            <Pressable
              onPress={() => setShowRiskAssessment(true)}
              className={`border-2 py-4 rounded-2xl flex-row items-center justify-center mb-4 ${
                isDark
                  ? "bg-dark-lavender/10 border-dark-lavender/30 active:bg-dark-lavender/20"
                  : "bg-primary-light/50 border-primary/20 active:bg-primary-light"
              }`}
            >
              <Sparkles size={20} color={isDark ? "#C9A0DC" : "#923D5C"} />
              <Text className={`font-inter-bold ml-2 ${isDark ? "text-dark-lavender" : "text-primary"}`}>
                How often should I test?
              </Text>
            </Pressable>
          )}

          {/* Share Status Button */}
          {results.length > 0 && (
            <Pressable
              onPress={() => setShowStatusShare(true)}
              className={`border-2 py-4 rounded-2xl flex-row items-center justify-center mb-4 ${
                isDark
                  ? "bg-dark-accent-muted border-dark-accent/30 active:bg-dark-accent/20"
                  : "bg-primary-light/50 border-primary/20 active:bg-primary-light"
              }`}
            >
              <Share2 size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
              <Text className={`font-inter-bold ml-2 ${isDark ? "text-dark-accent" : "text-primary"}`}>
                Share without the awkward
              </Text>
            </Pressable>
          )}

          {/* Known Conditions Section */}
          {knownConditionsStatus.length > 0 && (
            <View className="mb-6">
              <Text className={`text-xl font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-text"}`}>
                Your Status
              </Text>
              <Card className="p-4">
                {knownConditionsStatus.map((sti, index) => (
                  <View
                    key={sti.name}
                    className={`flex-row items-center justify-between ${index > 0 ? "mt-3 pt-3 border-t" : ""} ${isDark ? "border-dark-border" : "border-border"}`}
                  >
                    <View>
                      <Text className={`font-inter-semibold ${isDark ? "text-dark-text" : "text-text"}`}>
                        {sti.name}
                      </Text>
                      <Text className={`text-xs mt-0.5 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                        Last tested: {formatDate(sti.testDate)}
                      </Text>
                    </View>
                    <Badge label="Known" variant="info" />
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* Results Section */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-xl font-inter-bold ${isDark ? "text-dark-text" : "text-text"}`}>
              Your Results
            </Text>
            {results.length > 0 && (
              <Text className={`font-inter-medium ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>
                {results.length} total
              </Text>
            )}
          </View>

          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={isDark ? "#FF2D7A" : "#923D5C"} />
            </View>
          ) : results.length === 0 ? (
            <Card className={`p-8 items-center justify-center border-2 border-dashed mb-8 ${isDark ? "border-dark-border bg-dark-surface/50" : "border-border bg-primary-muted/30"}`}>
              <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light"}`}>
                <FileText size={32} color={isDark ? "#FF2D7A" : "#923D5C"} />
              </View>
              <Text className={`text-xl font-inter-bold mb-2 ${isDark ? "text-dark-text" : "text-text"}`}>
                Nothing here yet
              </Text>
              <Text className={`font-inter-regular text-center mb-6 leading-5 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                Add your first result and start sharing{"\n"}on your terms. Privacy included.
              </Text>
              <Link href="/upload" asChild>
                <Pressable className={`px-8 py-3 rounded-full ${isDark ? "bg-dark-accent" : "bg-primary"}`}>
                  <Text className="text-white font-inter-bold">Add Your First</Text>
                </Pressable>
              </Link>
            </Card>
          ) : (
            <View className="gap-3 mb-8">
              {results.slice(0, 5).map((result, index) => (
                <ResultCard key={result.id} result={result} index={index} isDark={isDark} hasKnownCondition={hasKnownCondition} />
              ))}
              {results.length > 5 && (
                <Pressable className={`py-4 items-center rounded-2xl ${isDark ? "bg-dark-surface-light" : "bg-primary-muted"}`}>
                  <Text className={`font-inter-bold ${isDark ? "text-dark-accent" : "text-primary"}`}>
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
            <Text className={`font-inter-medium ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <StatusShareModal
        visible={showStatusShare}
        onClose={() => setShowStatusShare(false)}
      />

      <RiskAssessment
        visible={showRiskAssessment}
        onClose={() => setShowRiskAssessment(false)}
        onComplete={(level) => {
          // Update local state immediately for instant UI update
          updateRiskLevel(level);
        }}
      />
    </SafeAreaView>
  );
}

function ResultCard({ result, index, isDark, hasKnownCondition }: { result: TestResult; index: number; isDark: boolean; hasKnownCondition: (name: string) => boolean }) {
  const router = useRouter();

  // Check if all positive STIs in this result are known conditions
  const allPositivesAreKnown = result.sti_results?.length > 0 &&
    result.sti_results
      .filter((sti) => sti.status === "positive")
      .every((sti) => hasKnownCondition(sti.name));

  const statusConfig = {
    negative: {
      bgLight: "bg-success-light",
      bgDark: "bg-dark-success-bg",
      text: isDark ? "text-dark-success" : "text-success-dark",
      label: "All Clear ✓",
      icon: isDark ? "#00E5A0" : "#10B981",
    },
    positive: {
      bgLight: "bg-danger-light",
      bgDark: "bg-dark-danger-bg",
      text: "text-danger",
      label: "Positive",
      icon: "#EF4444",
    },
    pending: {
      bgLight: "bg-warning-light",
      bgDark: "bg-dark-warning-bg",
      text: isDark ? "text-dark-warning" : "text-warning",
      label: "Pending",
      icon: "#F59E0B",
    },
    inconclusive: {
      bgLight: "bg-gray-100",
      bgDark: "bg-dark-surface-light",
      text: isDark ? "text-dark-text-secondary" : "text-gray-600",
      label: "Inconclusive",
      icon: isDark ? "#C9A0DC" : "#6B7280",
    },
    known: {
      bgLight: "bg-purple-100",
      bgDark: "bg-dark-lavender/20",
      text: isDark ? "text-dark-lavender" : "text-purple-700",
      label: "Known",
      icon: isDark ? "#C9A0DC" : "#7C3AED",
    },
  };

  // Use "known" status if positive but all positives are known conditions
  const effectiveStatus = result.status === "positive" && allPositivesAreKnown ? "known" : result.status;
  const status = statusConfig[effectiveStatus];

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD without timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
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
      <Card className="flex-row items-center">
        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isDark ? status.bgDark : status.bgLight}`}>
          <FileText size={22} color={status.icon} />
        </View>
        <View className="flex-1">
          <Text className={`font-inter-bold mb-1 ${isDark ? "text-dark-text" : "text-text"}`}>
            {result.test_type}
          </Text>
          <View className="flex-row items-center">
            <Text className={`text-sm font-inter-regular ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
              {formatDate(result.test_date)}
            </Text>
            {result.is_verified && (
              <>
                <Text className={`mx-2 ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>•</Text>
                <ShieldCheck size={14} color={isDark ? "#00E5A0" : "#10B981"} />
              </>
            )}
          </View>
        </View>
        <View className={`px-3 py-1.5 rounded-full ${isDark ? status.bgDark : status.bgLight}`}>
          <Text className={`${status.text} font-inter-bold text-xs`}>
            {status.label}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
