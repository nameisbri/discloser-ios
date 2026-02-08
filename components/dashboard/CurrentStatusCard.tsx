import { View, Text, Pressable, Animated } from "react-native";
import { Calendar, ShieldCheck, Share2 } from "lucide-react-native";
import { Card } from "../Card";
import { formatDate } from "../../lib/utils/date";
import { hapticImpact } from "../../lib/utils/haptics";
import { useReducedMotion, usePressAnimation } from "../../lib/utils/animations";
import type { TestResult } from "../../lib/types";

interface CurrentStatusCardProps {
  result: TestResult;
  isDark: boolean;
  hasKnownCondition: (testName: string) => boolean;
  onShare: () => void;
  onPress: () => void;
}

interface StatusStyle {
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  label: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  negative: {
    bgLight: "bg-success-light",
    bgDark: "bg-dark-success-bg",
    textLight: "text-success-dark",
    textDark: "text-dark-success",
    label: "All Clear",
  },
  positive: {
    bgLight: "bg-danger-light",
    bgDark: "bg-dark-danger-bg",
    textLight: "text-danger",
    textDark: "text-danger",
    label: "Positive",
  },
  pending: {
    bgLight: "bg-warning-light",
    bgDark: "bg-dark-warning-bg",
    textLight: "text-warning",
    textDark: "text-dark-warning",
    label: "Pending",
  },
  inconclusive: {
    bgLight: "bg-gray-100",
    bgDark: "bg-dark-surface-light",
    textLight: "text-gray-600",
    textDark: "text-dark-text-secondary",
    label: "Inconclusive",
  },
  known: {
    bgLight: "bg-purple-100",
    bgDark: "bg-dark-lavender/20",
    textLight: "text-purple-700",
    textDark: "text-dark-lavender",
    label: "Managed",
  },
};

function getEffectiveStatus(
  result: TestResult,
  hasKnownCondition: (name: string) => boolean
): string {
  if (result.status !== "positive") return result.status;

  const allPositivesKnown =
    result.sti_results?.length > 0 &&
    result.sti_results
      .filter((sti) => sti.status === "positive")
      .every((sti) => hasKnownCondition(sti.name));

  return allPositivesKnown ? "known" : result.status;
}

export function CurrentStatusCard({
  result,
  isDark,
  hasKnownCondition,
  onShare,
  onPress,
}: CurrentStatusCardProps) {
  const reduceMotion = useReducedMotion();
  const { scale, handlePressIn, handlePressOut } = usePressAnimation(reduceMotion);

  const effectiveStatus = getEffectiveStatus(result, hasKnownCondition);
  const style = STATUS_STYLES[effectiveStatus] ?? STATUS_STYLES.inconclusive;

  const handleCardPress = async () => {
    await hapticImpact("light");
    onPress();
  };

  const handleSharePress = async () => {
    await hapticImpact("light");
    onShare();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${result.test_type} result from ${formatDate(result.test_date)}, status ${style.label}`}
        accessibilityHint="View test result details"
      >
        <Card className="p-6" accessibilityElementsHidden>
          {/* Top row: test type + share action */}
          <View className="flex-row items-center justify-between mb-3">
            <Text
              numberOfLines={2}
              className={`text-lg font-inter-bold flex-1 mr-3 ${
                isDark ? "text-dark-text" : "text-text"
              }`}
            >
              {result.test_type}
            </Text>
            <Pressable
              onPress={handleSharePress}
              className="flex-row items-center px-3 py-1.5 rounded-xl active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Share this result"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Share2 size={16} color="#FF2D7A" />
              <Text className="ml-1.5 font-inter-semibold text-sm text-[#FF2D7A]">
                Share
              </Text>
            </Pressable>
          </View>

          {/* Bottom row: date, verified badge, status badge */}
          <View className="flex-row items-center">
            <Calendar
              size={14}
              color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"}
            />
            <Text
              className={`text-sm font-inter-regular ml-1.5 ${
                isDark ? "text-dark-text-secondary" : "text-text-light"
              }`}
            >
              {formatDate(result.test_date)}
            </Text>

            {result.is_verified && (
              <>
                <Text
                  className={`mx-2 ${
                    isDark ? "text-dark-text-muted" : "text-text-muted"
                  }`}
                >
                  {"\u2022"}
                </Text>
                <ShieldCheck
                  size={14}
                  color={isDark ? "#00E5A0" : "#10B981"}
                />
              </>
            )}

            <View className="flex-1" />

            <View
              className={`px-3 py-1.5 rounded-full ${
                isDark ? style.bgDark : style.bgLight
              }`}
            >
              <Text
                className={`font-inter-bold text-xs ${
                  isDark ? style.textDark : style.textLight
                }`}
              >
                {style.label}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
