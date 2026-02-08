import { View, Text, Pressable, Animated } from "react-native";
import { ShieldCheck, ChevronRight } from "lucide-react-native";
import { Card } from "../Card";
import { Badge } from "../Badge";
import { formatDate } from "../../lib/utils/date";
import { hapticImpact } from "../../lib/utils/haptics";
import { useReducedMotion, usePressAnimation } from "../../lib/utils/animations";
import type { TestResult } from "../../lib/types";

interface CurrentStatusCardProps {
  result: TestResult;
  isDark: boolean;
  hasKnownCondition: (testName: string) => boolean;
  onPress: () => void;
}

interface StatusConfig {
  label: string;
  badgeVariant: "default" | "success" | "danger" | "warning" | "outline" | "info";
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  negative: { label: "All Clear", badgeVariant: "success" },
  positive: { label: "Positive", badgeVariant: "danger" },
  pending: { label: "Pending", badgeVariant: "warning" },
  inconclusive: { label: "Inconclusive", badgeVariant: "outline" },
  known: { label: "Managed", badgeVariant: "info" },
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
  onPress,
}: CurrentStatusCardProps) {
  const reduceMotion = useReducedMotion();
  const { scale, handlePressIn, handlePressOut } = usePressAnimation(reduceMotion);

  const effectiveStatus = getEffectiveStatus(result, hasKnownCondition);
  const config = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.inconclusive;

  const handleCardPress = async () => {
    await hapticImpact("light");
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${result.test_type} result from ${formatDate(result.test_date)}, status ${config.label}`}
        accessibilityHint="View test result details"
      >
        <Card className="p-6" accessibilityElementsHidden>
          {/* Row 1: Result title + status badge */}
          <View className="flex-row items-center justify-between mb-2">
            <Text
              numberOfLines={2}
              className={`text-lg font-inter-bold flex-1 mr-3 ${
                isDark ? "text-dark-text" : "text-text"
              }`}
            >
              {result.test_type}
            </Text>
            <Badge label={config.label} variant={config.badgeVariant} />
          </View>

          {/* Row 2: Date + verification + chevron */}
          <View className="flex-row items-center">
            <Text
              className={`text-sm font-inter-regular ${
                isDark ? "text-dark-text-secondary" : "text-text-light"
              }`}
            >
              {formatDate(result.test_date)}
            </Text>
            {result.is_verified && (
              <>
                <Text
                  className={`mx-1.5 ${
                    isDark ? "text-dark-text-muted" : "text-text-muted"
                  }`}
                >
                  {"\u2022"}
                </Text>
                <ShieldCheck
                  size={14}
                  color={isDark ? "#00E5A0" : "#10B981"}
                />
                <Text
                  className={`text-sm font-inter-medium ml-1 ${
                    isDark ? "text-dark-success" : "text-success-dark"
                  }`}
                >
                  Verified
                </Text>
              </>
            )}
            <View className="flex-1" />
            <ChevronRight
              size={18}
              color={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
            />
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
