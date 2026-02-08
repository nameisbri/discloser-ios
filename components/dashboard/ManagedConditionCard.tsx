import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Badge } from "../Badge";
import { ManagementMethodPills } from "../ManagementMethodPills";
import { formatDate } from "../../lib/utils/date";

interface ManagedCondition {
  condition: string;
  testDate: string | null;
  declaredDate: string | null;
  isFromTest: boolean;
  managementMethods?: string[];
}

interface ManagedConditionCardProps {
  conditions: ManagedCondition[];
  isDark: boolean;
  maxVisible?: number;
}

function getDateLabel(condition: ManagedCondition): string {
  const dateStr = condition.isFromTest ? condition.testDate : condition.declaredDate;
  if (!dateStr) return "No date recorded";
  const prefix = condition.isFromTest ? "Last tested" : "Declared";
  return `${prefix}: ${formatDate(dateStr)}`;
}

export function ManagedConditionCard({
  conditions,
  isDark,
  maxVisible = 2,
}: ManagedConditionCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (conditions.length === 0) return null;

  const hasOverflow = conditions.length > maxVisible;
  const visibleConditions = expanded ? conditions : conditions.slice(0, maxVisible);
  const hiddenCount = conditions.length - maxVisible;

  return (
    <View
      className={`rounded-2xl p-5 border ${
        isDark
          ? "border-[rgba(201,160,220,0.3)]"
          : "bg-purple-50 border-purple-200"
      }`}
      style={isDark ? { backgroundColor: "rgba(201,160,220,0.1)" } : undefined}
    >
      {visibleConditions.map((condition, index) => (
        <View
          key={condition.condition}
          className={`${
            index > 0 ? "mt-3 pt-3 border-t" : ""
          } ${isDark ? "border-dark-border" : "border-border"}`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text
                className={`font-inter-bold ${
                  isDark ? "text-dark-text" : "text-text"
                }`}
              >
                {condition.condition}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${
                  isDark ? "text-dark-text-muted" : "text-text-light"
                }`}
              >
                {getDateLabel(condition)}
              </Text>
            </View>
            <Badge label="Managed" variant="info" />
          </View>
          {condition.managementMethods && condition.managementMethods.length > 0 && (
            <ManagementMethodPills
              methods={condition.managementMethods}
              isDark={isDark}
            />
          )}
        </View>
      ))}

      {hasOverflow && (
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          className="mt-3 pt-3 border-t flex-row items-center justify-center"
          style={{
            borderTopColor: isDark
              ? "rgba(201,160,220,0.2)"
              : "rgba(147,51,234,0.15)",
          }}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? "Show fewer conditions"
              : `Show ${hiddenCount} more condition${hiddenCount === 1 ? "" : "s"}`
          }
        >
          {expanded ? (
            <ChevronUp size={16} color={isDark ? "#C9A0DC" : "#7C3AED"} />
          ) : (
            <ChevronDown size={16} color={isDark ? "#C9A0DC" : "#7C3AED"} />
          )}
          <Text
            className={`ml-1.5 font-inter-semibold text-sm ${
              isDark ? "text-dark-lavender" : "text-purple-700"
            }`}
          >
            {expanded ? "Show less" : `+${hiddenCount} more`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
