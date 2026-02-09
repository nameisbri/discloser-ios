import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../../context/theme";
import { useTestResults, useSTIStatus, useProfile, useTestingRecommendations, formatDueMessage, useReminderSync } from "../../../lib/hooks";
import { useReminders } from "../../../lib/hooks";
import {
  Bell,
  FileText,
  Share2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from "lucide-react-native";
import { StatusShareModal } from "../../../components/StatusShareModal";
import { RiskAssessment } from "../../../components/RiskAssessment";
import { Card } from "../../../components/Card";
import { ResultCard } from "../../../components/ResultCard";
import { SkeletonResultsList } from "../../../components/SkeletonLoader";
import { CurrentStatusCard, ManagedConditionCard, EmptyDashboardState } from "../../../components/dashboard";
import { LinearGradient } from "expo-linear-gradient";
import { formatDate } from "../../../lib/utils/date";
import { hapticSelection } from "../../../lib/utils/haptics";
import { useState, useCallback, useRef } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { results, loading, refetch } = useTestResults();
  const { nextReminder, overdueReminder, activeReminders, refetch: refetchReminders, createReminder, deleteReminder } = useReminders();
  const { routineStatus, knownConditionsStatus, refetchProfile: refetchSTIProfile } = useSTIStatus();
  const { profile, refetch: refetchProfile, updateRiskLevel, hasKnownCondition } = useProfile();
  const recommendation = useTestingRecommendations(results);

  // Keep the stored reminder in sync with the computed recommendation
  useReminderSync({
    results,
    riskLevel: profile?.risk_level ?? null,
    activeReminders,
    createReminder,
    deleteReminder,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [showStatusShare, setShowStatusShare] = useState(false);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const lastFetchRef = useRef<number>(0);

  // Optimized focus refetch: only refetch if data is stale (>10s old)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchRef.current;

      // Only refetch if data is older than 10 seconds
      if (timeSinceLastFetch > 10000) {
        const timeoutId = setTimeout(() => {
          lastFetchRef.current = now;
          refetch();
          refetchReminders();
          refetchProfile();
          refetchSTIProfile();
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }, [refetch, refetchReminders, refetchProfile, refetchSTIProfile])
  );

  const onRefresh = useCallback(async () => {
    await hapticSelection();
    setRefreshing(true);
    lastFetchRef.current = Date.now();
    await Promise.all([refetch(), refetchReminders(), refetchProfile(), refetchSTIProfile()]);
    setRefreshing(false);
  }, [refetch, refetchReminders, refetchProfile, refetchSTIProfile]);

  // Memoize hasKnownCondition to maintain stable reference for ResultCard
  const hasKnownConditionMemoized = useCallback(
    (name: string) => hasKnownCondition(name),
    [hasKnownCondition]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Map knownConditionsStatus to ManagedConditionCard format
  const managedConditions = knownConditionsStatus.map((sti) => ({
    condition: sti.name,
    testDate: sti.hasTestData ? sti.testDate : null,
    declaredDate: !sti.hasTestData ? sti.testDate : null,
    isFromTest: sti.hasTestData ?? false,
    managementMethods: sti.managementMethods,
  }));

  const hasData = results.length > 0 || knownConditionsStatus.length > 0;
  const historyResults = results.slice(1);
  const visibleHistory = showAllHistory ? historyResults : historyResults.slice(0, 4);
  const hasMoreHistory = historyResults.length > 4 && !showAllHistory;

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
        {/* Header with gradient — includes reminder inline */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <View className="flex-row items-center mb-6">
              <Image
                source={require("../../../assets/logomark.png")}
                style={{ width: 40, height: 40, marginRight: 12 }}
              />
              <Text className="text-white/90 font-inter-bold text-lg">Discloser</Text>
          </View>

          <Text className="text-white/70 font-inter-medium mb-1">
            {getGreeting()} 👋
          </Text>
          <Text className="text-3xl font-inter-bold text-white mb-4">
            Looking good out there
          </Text>

          {/* Status pill - based on routine tests only */}
          {routineStatus.length > 0 && routineStatus.every((s) => s.status === "negative") && (
            <View className={`flex-row items-center self-start px-4 py-2 rounded-full mb-4 ${isDark ? "bg-dark-mint/20" : "bg-white/20"}`}>
              <ShieldCheck size={16} color={isDark ? "#00E5A0" : "#10B981"} />
              <Text className="text-white font-inter-semibold ml-2 text-sm">
                All clear. Share with confidence.
              </Text>
            </View>
          )}

          {/* Next checkup reminder — inline inside gradient */}
          {recommendation.isOverdue && recommendation.nextDueDate ? (
            <Pressable
              onPress={() => router.push("/reminders")}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-red-500/20 active:bg-red-500/30"
            >
              <View className="flex-row items-center flex-1">
                <Bell size={18} color="#EF4444" />
                <View className="ml-3">
                  <Text className="text-red-300 font-inter-medium text-xs">Overdue</Text>
                  <Text className="text-white font-inter-bold text-sm">
                    {formatDate(recommendation.nextDueDate)}
                  </Text>
                </View>
              </View>
              <Text className="font-inter-semibold text-sm text-red-300">Edit</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push("/reminders")}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-white/10 active:bg-white/15"
            >
              <View className="flex-row items-center flex-1">
                <Bell size={18} color="rgba(255,255,255,0.7)" />
                <View className="ml-3">
                  <Text className="text-white/60 font-inter-medium text-xs">Next checkup</Text>
                  <Text className="text-white font-inter-bold text-sm">
                    {nextReminder
                      ? formatDate(nextReminder.next_date)
                      : "Set a reminder"}
                  </Text>
                </View>
              </View>
              <Text className="font-inter-semibold text-sm text-white/70">
                {nextReminder ? "Edit" : "Add"}
              </Text>
            </Pressable>
          )}
        </LinearGradient>

        <View className="px-6 mt-6">
          {/* Testing Overdue - Small inline warning */}
          {(recommendation.isOverdue || recommendation.isDueSoon) && (
            <View className="flex-row items-center justify-center mb-4">
              <AlertTriangle size={14} color="#F59E0B" />
              <Text className={`font-inter-medium text-xs ml-1.5 ${isDark ? "text-dark-warning" : "text-warning-dark"}`}>
                {formatDueMessage(recommendation)}
              </Text>
            </View>
          )}

          {/* Empty state for zero results + zero conditions */}
          {!loading && !hasData && (
            <EmptyDashboardState
              isDark={isDark}
              onUpload={() => router.push("/upload")}
            />
          )}

          {/* Current Status Section — most recent result + managed conditions */}
          {(loading || hasData) && (
            <View className="mb-6">
              <Text className={`text-2xl font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-text"}`}>
                Current Status
              </Text>

              {/* Most recent result as prominent card */}
              {loading ? (
                <View className="mb-3">
                  <SkeletonResultsList count={1} />
                </View>
              ) : results.length > 0 ? (
                <View className="mb-3">
                  <CurrentStatusCard
                    result={results[0]}
                    isDark={isDark}
                    hasKnownCondition={hasKnownConditionMemoized}
                    onPress={() => router.push(`/results/${results[0].id}`)}
                  />
                </View>
              ) : null}

              {/* Managed conditions with purple tint */}
              {loading ? (
                <View className="mt-1">
                  <SkeletonResultsList count={1} />
                </View>
              ) : managedConditions.length > 0 ? (
                <ManagedConditionCard
                  conditions={managedConditions}
                  isDark={isDark}
                />
              ) : null}
            </View>
          )}

          {/* Share My Current Status — below status section for context */}
          {results.length > 0 && (
            <View className="mb-4">
              <Pressable
                onPress={() => setShowStatusShare(true)}
                className={`border-2 py-4 rounded-2xl flex-row items-center justify-center ${
                  isDark
                    ? "bg-dark-accent-muted border-dark-accent/30 active:bg-dark-accent/20"
                    : "bg-primary-light/50 border-primary/20 active:bg-primary-light"
                }`}
                accessibilityLabel="Share your current status"
                accessibilityRole="button"
                accessibilityHint="Opens options to share your test status"
              >
                <Share2 size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
                <Text className={`font-inter-bold ml-2 ${isDark ? "text-dark-accent" : "text-primary"}`}>
                  Share My Current Status
                </Text>
              </Pressable>
              <Text className={`text-xs text-center mt-1.5 ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>
                Send a link with your latest results
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

          {/* Divider between sections */}
          {hasData && (
            <View className={`h-px mb-6 ${isDark ? "bg-dark-border" : "bg-border"}`} />
          )}

          {/* Test History Section */}
          {(loading || results.length > 1) && (
            <>
              <View className="flex-row items-center justify-between mb-4">
                <Text className={`text-xl font-inter-semibold ${isDark ? "text-dark-text-secondary" : "text-text"}`}>
                  Test History
                </Text>
                {historyResults.length > 0 && (
                  <View className={`px-3 py-1 rounded-full ${isDark ? "bg-dark-accent-muted" : "bg-primary-muted"}`}>
                    <Text className={`font-inter-semibold text-xs ${isDark ? "text-dark-accent" : "text-primary"}`}>
                      {historyResults.length}
                    </Text>
                  </View>
                )}
              </View>

              {loading ? (
                <View className="mb-8">
                  <SkeletonResultsList count={3} />
                </View>
              ) : (
                <View className="gap-3 mb-4">
                  {visibleHistory.map((result, index) => (
                    <ResultCard key={result.id} result={result} index={index} isDark={isDark} hasKnownCondition={hasKnownConditionMemoized} />
                  ))}
                </View>
              )}

              {/* View All Results expand */}
              {hasMoreHistory && (
                <Pressable
                  onPress={() => setShowAllHistory(true)}
                  className="py-3 items-center mb-4"
                  accessibilityRole="button"
                  accessibilityLabel={`View all results, ${historyResults.length - 4} more`}
                >
                  <Text className={`font-inter-semibold ${isDark ? "text-dark-accent" : "text-primary"}`}>
                    View All Results ({historyResults.length - 4} more)
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {/* Empty history state (has 1 result but no history) */}
          {!loading && results.length === 1 && (
            <Card className={`p-8 items-center justify-center border-2 border-dashed mb-8 ${isDark ? "border-dark-border bg-dark-surface/50" : "border-border bg-primary-muted/30"}`}>
              <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light"}`}>
                <FileText size={32} color={isDark ? "#FF2D7A" : "#923D5C"} />
              </View>
              <Text className={`font-inter-regular text-center leading-5 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                Your full history will appear here{"\n"}as you add more results.
              </Text>
            </Card>
          )}

          {/* Bottom spacer */}
          <View className="h-8" />
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
          updateRiskLevel(level);
        }}
      />
    </SafeAreaView>
  );
}
