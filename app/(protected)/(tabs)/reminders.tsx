import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Bell,
  Calendar,
  CalendarPlus,
  Clock,
  CheckCircle2,
  ChevronLeft,
  X,
  Pencil,
  AlertTriangle,
} from "lucide-react-native";
import { useReminders, useTestResults, useTestingRecommendations, formatDueMessage } from "../../../lib/hooks";
import { useTheme } from "../../../context/theme";
import { Card } from "../../../components/Card";
import { HeaderLogo } from "../../../components/HeaderLogo";
import { Button } from "../../../components/Button";
import type { Reminder, ReminderFrequency } from "../../../lib/types";
import { formatDate, parseDateOnly, toDateString } from "../../../lib/utils/date";
import { addToCalendar } from "../../../lib/calendar";
import { trackReminderSet } from "../../../lib/analytics";

const FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Every 3 months" },
  { value: "biannual", label: "Every 6 months" },
  { value: "annual", label: "Yearly" },
];

const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Every 3 months",
  biannual: "Every 6 months",
  annual: "Yearly",
};

/**
 * Computes the next reminder date for a given frequency.
 * Uses last test date as base; falls back to today if no results or if computed date is in the past.
 */
function computeNextDateForFrequency(
  lastTestDate: string | null,
  frequency: ReminderFrequency
): string {
  const base = lastTestDate ? parseDateOnly(lastTestDate) : new Date();
  base.setHours(0, 0, 0, 0);

  const next = new Date(base);
  addFrequencyInterval(next, frequency);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If the computed date is in the past, calculate from today instead
  if (next <= today) {
    const fromToday = new Date(today);
    addFrequencyInterval(fromToday, frequency);
    return toDateString(fromToday);
  }

  return toDateString(next);
}

function addFrequencyInterval(date: Date, frequency: ReminderFrequency): void {
  switch (frequency) {
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "biannual":
      date.setMonth(date.getMonth() + 6);
      break;
    case "annual":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
}

export default function Reminders() {
  const router = useRouter();
  const { isDark } = useTheme();
  const {
    activeReminders,
    loading,
    refetch,
    updateReminder,
  } = useReminders();
  const { results } = useTestResults();
  const recommendation = useTestingRecommendations(results);

  // Refetch when tab gains focus so data is fresh after uploads or dashboard sync
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [refreshing, setRefreshing] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editFrequency, setEditFrequency] = useState<ReminderFrequency>("quarterly");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const routineReminder = activeReminders.find((r) => r.title === "Routine Checkup") ?? activeReminders[0] ?? null;

  const handleEdit = (reminder: Reminder) => {
    setEditFrequency(reminder.frequency);
    setEditingReminder(reminder);
  };

  const handleSaveEdit = async () => {
    if (!editingReminder) return;

    const newNextDate = computeNextDateForFrequency(
      recommendation.lastTestDate,
      editFrequency
    );

    await updateReminder(editingReminder.id, {
      frequency: editFrequency,
      next_date: newNextDate,
    });

    const frequencyDays: Record<ReminderFrequency, number> = {
      monthly: 30, quarterly: 90, biannual: 180, annual: 365,
    };
    trackReminderSet({ interval_days: frequencyDays[editFrequency] });

    setEditingReminder(null);
  };

  const previewDate = computeNextDateForFrequency(
    recommendation.lastTestDate,
    editFrequency
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`} edges={["top", "left", "right"]}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
        <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Reminders
        </Text>
        <HeaderLogo />
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#FF2D7A" : "#923D5C"}
          />
        }
      >
        <View className="items-center mb-10 mt-2">
          <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? "bg-dark-warning-bg" : "bg-warning-light"}`}>
            <Bell size={40} color="#FFC107" />
          </View>
          <Text className={`text-3xl font-inter-bold mb-3 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
            Stay sharp
          </Text>
          <Text className={`font-inter-regular text-center ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
            Regular testing is hot. We'll remind you.
          </Text>
        </View>

        {/* Testing Overdue Alert */}
        {(recommendation.isOverdue || recommendation.isDueSoon) && (
          <Card className={`mb-6 border-2 border-warning ${isDark ? "bg-dark-warning-bg" : ""}`} style={!isDark ? { backgroundColor: "#FEF3C7" } : undefined}>
            <View className="flex-row items-center">
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? "bg-warning/30" : ""}`}
                style={!isDark ? { backgroundColor: "#FDE68A" } : undefined}
              >
                <AlertTriangle size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className={`font-inter-bold text-sm ${isDark ? "text-dark-warning" : "text-warning-dark"}`}>
                  {formatDueMessage(recommendation)}
                </Text>
                <Text className={`font-inter-regular text-xs mt-0.5 ${isDark ? "text-dark-warning/70" : "text-warning-dark/70"}`}>
                  Based on your {recommendation.riskLevel} risk assessment
                </Text>
              </View>
            </View>
          </Card>
        )}

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={isDark ? "#FF2D7A" : "#923D5C"} />
          </View>
        ) : routineReminder ? (
          <Card className="mb-8">
            <Text className={`text-xl font-inter-bold mb-6 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              Your Testing Schedule
            </Text>
            <ReminderDisplay
              reminder={routineReminder}
              onEdit={() => handleEdit(routineReminder)}
              onAddToCalendar={() => addToCalendar(routineReminder.title, routineReminder.next_date, FREQUENCY_LABELS[routineReminder.frequency])}
              isDark={isDark}
            />
          </Card>
        ) : (
          <Card className="mb-8">
            <Text className={`text-xl font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              Your Testing Schedule
            </Text>
            <View className="items-center py-6">
              <Calendar size={32} color={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"} />
              <Text className={`font-inter-regular text-center mt-3 leading-5 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                Your reminder will appear here once{"\n"}you complete your risk assessment.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Edit Reminder Modal */}
      <Modal
        visible={editingReminder !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingReminder(null)}
      >
        <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
          <View className={`flex-row items-center justify-between px-6 py-4 border-b ${isDark ? "border-dark-border" : "border-border"}`}>
            <Pressable
              onPress={() => setEditingReminder(null)}
              className="p-2 -ml-2"
            >
              <X size={24} color={isDark ? "#FFFFFF" : "#374151"} />
            </Pressable>
            <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              Edit Reminder
            </Text>
            <View className="w-10" />
          </View>

          <View className="flex-1 px-6 py-6">
            <View className="mb-8">
              <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
                How often do you want to test?
              </Text>
              <View className="gap-3">
                {FREQUENCY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setEditFrequency(option.value)}
                    className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                      editFrequency === option.value
                        ? isDark
                          ? "bg-dark-accent-muted border-dark-accent"
                          : "bg-primary-light/30 border-primary"
                        : isDark
                        ? "bg-dark-surface border-dark-border"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`font-inter-medium ${
                        editFrequency === option.value
                          ? isDark ? "text-dark-accent" : "text-primary"
                          : isDark ? "text-dark-text" : "text-text"
                      }`}
                    >
                      {option.label}
                    </Text>
                    {editFrequency === option.value && (
                      <CheckCircle2 size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View className={`p-5 rounded-3xl mb-8 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/20"}`}>
              <Text className={`font-inter-medium text-sm ${isDark ? "text-dark-accent" : "text-primary-dark"}`}>
                Next checkup on{" "}
                <Text className="font-inter-bold">
                  {formatDate(previewDate)}
                </Text>
              </Text>
            </View>

            <Button label="Save Changes" onPress={handleSaveEdit} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ReminderDisplay({
  reminder,
  onEdit,
  onAddToCalendar,
  isDark,
}: {
  reminder: Reminder;
  onEdit: () => void;
  onAddToCalendar: () => void;
  isDark: boolean;
}) {
  const isPast = parseDateOnly(reminder.next_date) < new Date();

  return (
    <View>
      <View className="flex-row items-start">
        <View
          className={`p-3 rounded-2xl mr-4 ${
            isDark ? "bg-dark-accent-muted" : "bg-primary-light"
          }`}
        >
          <Calendar
            size={24}
            color={isDark ? "#FF2D7A" : "#923D5C"}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`font-inter-semibold flex-1 ${isDark ? "text-dark-text" : "text-text"}`}>
              {reminder.title}
            </Text>
            <View className={`flex-row items-center ml-2 px-2 py-1 rounded-full ${
              isPast
                ? isDark ? "bg-dark-warning-bg" : "bg-warning-light"
                : isDark ? "bg-dark-success-bg" : "bg-success-light/50"
            }`}>
              <CheckCircle2
                size={12}
                color={isPast ? "#F59E0B" : (isDark ? "#00E5A0" : "#10B981")}
              />
            </View>
          </View>
          <View className="flex-row items-center flex-wrap">
            <Clock size={12} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />
            <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
              {FREQUENCY_LABELS[reminder.frequency]}
            </Text>
            <Text className={`text-xs mx-1 ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>•</Text>
            <Text className={`text-xs font-inter-medium ${
              isPast
                ? "text-warning"
                : isDark ? "text-dark-text" : "text-text"
            }`}>
              {formatDate(reminder.next_date)}
            </Text>
          </View>
        </View>
      </View>
      {/* Action buttons */}
      <View className="flex-row items-center justify-end mt-3 gap-2">
        <Pressable
          onPress={onAddToCalendar}
          className={`flex-row items-center px-3 py-2 rounded-xl ${isDark ? "bg-dark-surface-light active:bg-dark-border" : "bg-gray-100 active:bg-gray-200"}`}
        >
          <CalendarPlus size={14} color={isDark ? "#00E5A0" : "#10B981"} />
          <Text className={`text-xs font-inter-medium ml-1.5 ${isDark ? "text-dark-mint" : "text-success"}`}>
            Add to Calendar
          </Text>
        </Pressable>
        <Pressable
          onPress={onEdit}
          className={`flex-row items-center px-3 py-2 rounded-xl ${isDark ? "bg-dark-accent-muted active:bg-dark-accent/30" : "bg-primary-light/50 active:bg-primary-light"}`}
        >
          <Pencil size={14} color={isDark ? "#FF2D7A" : "#923D5C"} />
          <Text className={`text-xs font-inter-medium ml-1.5 ${isDark ? "text-dark-accent" : "text-primary"}`}>
            Edit
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
