import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Share2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Trash2,
} from "lucide-react-native";
import { useTestResult, useTestResults, useProfile } from "../../../../lib/hooks";
import { useTheme } from "../../../../context/theme";
import { Badge } from "../../../../components/Badge";
import { Card } from "../../../../components/Card";
import { Button } from "../../../../components/Button";
import { ShareModal } from "../../../../components/ShareModal";
import { SkeletonLoader, SkeletonText } from "../../../../components/SkeletonLoader";
import { hapticImpact, hapticNotification } from "../../../../lib/utils/haptics";
import { findMatchingKnownCondition } from "../../../../lib/utils/stiMatching";
import { ManagementMethodPills } from "../../../../components/ManagementMethodPills";
import type { STIResult } from "../../../../lib/types";
import { formatDate } from "../../../../lib/utils/date";
import { HeaderLogo } from "../../../../components/HeaderLogo";

export default function ResultDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { result, loading, error } = useTestResult(id);
  const { deleteResult } = useTestResults();
  const { hasKnownCondition, profile } = useProfile();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleDelete = async () => {
    await hapticNotification("warning");
    Alert.alert(
      "Delete Result",
      "Are you sure you want to delete this test result? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (id) {
              await hapticImpact("heavy");
              const success = await deleteResult(id);
              if (success) {
                await hapticNotification("success");
                router.replace("/dashboard");
              } else {
                await hapticNotification("error");
                Alert.alert("Couldn't Delete", "Something went wrong while deleting this result. Please try again.");
              }
            }
          },
        },
      ]
    );
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`} edges={["top", "left", "right"]}>
        {/* Header skeleton */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <SkeletonLoader width={40} height={40} borderRadius={8} />
          <SkeletonLoader width={80} height={24} borderRadius={12} />
          <SkeletonLoader width={40} height={40} borderRadius={8} />
        </View>

        <View className="px-6">
          {/* Status card skeleton */}
          <View
            className={`rounded-2xl p-5 border mb-6 ${
              isDark ? "bg-dark-surface border-dark-border" : "bg-background-card border-border"
            }`}
          >
            <View className="flex-row items-center mb-4">
              <SkeletonLoader width={48} height={48} borderRadius={16} style={{ marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <SkeletonLoader width="60%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="40%" height={16} borderRadius={4} />
              </View>
            </View>
            <SkeletonLoader width="100%" height={32} borderRadius={16} />
          </View>

          {/* Results breakdown skeleton */}
          <SkeletonLoader width={120} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
          <View
            className={`rounded-2xl p-5 border ${
              isDark ? "bg-dark-surface border-dark-border" : "bg-background-card border-border"
            }`}
          >
            <SkeletonText lines={4} lineHeight={20} spacing={16} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`} edges={["top", "left", "right"]}>
        <View className="flex-row items-center px-6 py-4">
          <Pressable
            onPress={() => router.back()}
            className="p-2 -ml-2"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-danger font-inter-semibold text-lg mb-2">
            Result Not Found
          </Text>
          <Text className={`font-inter-regular text-center ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
            {error || "This test result could not be loaded."}
          </Text>
          <Button
            label="Go Back"
            variant="secondary"
            onPress={() => router.back()}
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  const statusVariant =
    result.status === "negative"
      ? "success"
      : result.status === "positive"
      ? "danger"
      : "warning";

  const statusLabel =
    result.status.charAt(0).toUpperCase() + result.status.slice(1);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`} edges={["top", "left", "right"]}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
        <HeaderLogo showText />
        <Pressable
          onPress={handleShare}
          className={`p-2 rounded-xl ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/50"}`}
        >
          <Share2 size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        <Card className="mb-6 mt-4">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1 mr-4">
              <Text className={`font-inter-medium text-sm uppercase tracking-wider mb-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                Test Type
              </Text>
              <Text className={`text-2xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
                {result.test_type}
              </Text>
            </View>
            <Badge label={statusLabel} variant={statusVariant} />
          </View>

          <View className="flex-row gap-8 mb-6">
            <View>
              <Text className={`font-inter-medium text-xs mb-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                TEST DATE
              </Text>
              <View className="flex-row items-center">
                <Calendar size={14} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />
                <Text className={`font-inter-semibold ml-1 ${isDark ? "text-dark-text" : "text-text"}`}>
                  {formatDate(result.test_date)}
                </Text>
              </View>
            </View>
            <View>
              <Text className={`font-inter-medium text-xs mb-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                VERIFIED
              </Text>
              <View className="flex-row items-center">
                <ShieldCheck
                  size={14}
                  color={result.is_verified ? (isDark ? "#00E5A0" : "#28A745") : "#9CA3AF"}
                />
                <Text
                  className={`font-inter-semibold ml-1 ${
                    result.is_verified
                      ? isDark ? "text-dark-mint" : "text-success"
                      : isDark ? "text-dark-text-secondary" : "text-text-light"
                  }`}
                >
                  {result.is_verified ? "Yes" : "No"}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {result.sti_results && result.sti_results.length > 0 && (
          <>
            <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              Detailed Breakdown
            </Text>

            <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
              {result.sti_results.map((sti, index) => {
                const isKnown = hasKnownCondition(sti.name);
                const matchedKc = isKnown ? findMatchingKnownCondition(sti.name, profile?.known_conditions || []) : undefined;
                return (
                  <View key={index}>
                    {index > 0 && <View className={`h-[1px] mx-4 ${isDark ? "bg-dark-border" : "bg-border"}`} />}
                    <STILineItem
                      name={sti.name}
                      result={sti.result}
                      status={sti.status}
                      isKnown={isKnown}
                      managementMethods={matchedKc?.management_methods}
                      isDark={isDark}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}

        {result.notes && (
          <Card className="mb-6">
            <Text className={`font-inter-medium text-xs mb-2 uppercase tracking-wider ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
              Notes
            </Text>
            <Text className={`font-inter-regular leading-5 ${isDark ? "text-dark-text" : "text-text"}`}>
              {result.notes}
            </Text>
          </Card>
        )}

        <View className={`p-5 rounded-3xl flex-row items-start mb-6 ${isDark ? "bg-dark-warning-bg" : "bg-warning-light/30"}`}>
          <AlertCircle size={20} color="#FFC107" />
          <Text className={`ml-3 flex-1 text-sm leading-5 font-inter-regular ${isDark ? "text-dark-text" : "text-text"}`}>
            This result is for information purposes only. Always consult with a
            healthcare professional for medical advice.
          </Text>
        </View>

        <Pressable
          onPress={handleDelete}
          className="flex-row items-center justify-center py-4 mb-12"
          accessibilityLabel="Delete Result"
          accessibilityRole="button"
          accessibilityHint="Permanently deletes this test result"
        >
          <Trash2 size={18} color="#DC3545" />
          <Text className="text-danger font-inter-medium ml-2">
            Delete Result
          </Text>
        </Pressable>
      </ScrollView>

      <View className={`p-6 border-t ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
        <Button label="Share This Result" onPress={handleShare} />
      </View>

      {id && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          testResultId={id}
        />
      )}
    </SafeAreaView>
  );
}

function STILineItem({
  name,
  result,
  status,
  isKnown,
  managementMethods,
  isDark,
}: {
  name: string;
  result: string;
  status: STIResult["status"];
  isKnown: boolean;
  managementMethods?: string[];
  isDark: boolean;
}) {
  // Known conditions use purple instead of red for positive
  const textColor = isKnown
    ? isDark ? "text-dark-lavender" : "text-purple-600"
    : status === "negative"
    ? isDark ? "text-dark-mint" : "text-success"
    : status === "positive"
    ? "text-danger"
    : isDark ? "text-dark-warning" : "text-warning";

  return (
    <View className="p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className={`font-inter-medium ${isDark ? "text-dark-text" : "text-text"}`}>{name}</Text>
          {isKnown && (
            <View className={`ml-2 px-2 py-0.5 rounded-full ${isDark ? "bg-dark-lavender/20" : "bg-purple-100"}`}>
              <Text className={`text-[10px] font-inter-bold ${isDark ? "text-dark-lavender" : "text-purple-700"}`}>Managed</Text>
            </View>
          )}
        </View>
        <Text className={`${textColor} font-inter-semibold`}>{result}</Text>
      </View>
      {isKnown && managementMethods && managementMethods.length > 0 && (
        <ManagementMethodPills methods={managementMethods} isDark={isDark} />
      )}
    </View>
  );
}
