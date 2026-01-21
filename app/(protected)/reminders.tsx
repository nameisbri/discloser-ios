import { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  Calendar,
  CalendarPlus,
  Plus,
  Clock,
  CheckCircle2,
  ChevronLeft,
  X,
  Trash2,
  Sparkles,
  AlertTriangle,
} from "lucide-react-native";
import { useReminders, useTestResults, useTestingRecommendations, formatDueMessage } from "../../lib/hooks";
import { useTheme } from "../../context/theme";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import type { Reminder, ReminderFrequency } from "../../lib/types";
import { formatDate } from "../../lib/utils/date";
import { addToCalendar } from "../../lib/calendar";

const FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Every 3 months" },
  { value: "biannual", label: "Every 6 months" },
  { value: "annual", label: "Yearly" },
];

const RISK_FREQUENCY: Record<string, ReminderFrequency> = {
  low: "annual",
  moderate: "biannual",
  high: "quarterly",
};

export default function Reminders() {
  const router = useRouter();
  const { isDark } = useTheme();
  const {
    reminders,
    activeReminders,
    loading,
    refetch,
    createReminder,
    updateReminder,
    deleteReminder,
  } = useReminders();
  const { results } = useTestResults();
  const recommendation = useTestingRecommendations(results);

  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("Routine Checkup");
  const [newFrequency, setNewFrequency] =
    useState<ReminderFrequency>("quarterly");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getNextDate = (frequency: ReminderFrequency): string => {
    const date = new Date();
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
    return date.toISOString().split("T")[0];
  };

  const handleCreateReminder = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Title Required", "Give your reminder a name so you know what it's for.");
      return;
    }

    const result = await createReminder({
      title: newTitle,
      frequency: newFrequency,
      next_date: getNextDate(newFrequency),
      is_active: true,
    });

    if (result) {
      setShowModal(false);
      setNewTitle("Routine Checkup");
      setNewFrequency("quarterly");
    } else {
      Alert.alert("Couldn't Save Reminder", "Something went wrong. Please check your connection and try again.");
    }
  };

  const handleToggleActive = async (reminder: Reminder) => {
    await updateReminder(reminder.id, { is_active: !reminder.is_active });
  };

  const handleDelete = (reminder: Reminder) => {
    Alert.alert(
      "Delete Reminder",
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteReminder(reminder.id),
        },
      ]
    );
  };

  const inactiveReminders = reminders.filter((r) => !r.is_active);
  const pastReminders = reminders.filter(
    (r) => new Date(r.next_date) < new Date() && r.is_active
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
        <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Reminders
        </Text>
        <View className="w-10" />
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

        {/* Suggested Reminder based on risk */}
        {recommendation.riskLevel && recommendation.nextDueDate && activeReminders.length === 0 && (
          <Card className={`mb-6 border-2 ${isDark ? "bg-dark-accent-muted border-dark-accent/30" : "bg-primary-light/30 border-primary/20"}`}>
            <View className="flex-row items-center mb-3">
              <Sparkles size={18} color={isDark ? "#FF2D7A" : "#923D5C"} />
              <Text className={`font-inter-bold ml-2 ${isDark ? "text-dark-accent" : "text-primary"}`}>Just for you</Text>
            </View>
            <Text className={`font-inter-medium mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
              Based on your vibe, we'd say{" "}
              {recommendation.intervalDays === 365 ? "yearly" : recommendation.intervalDays === 180 ? "every 6 months" : "every 3 months"} works.
            </Text>
            <Text className={`text-sm mb-4 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
              Mark your calendar: {formatDate(recommendation.nextDueDate)}
            </Text>
            <Button
              label="Set it up"
              size="sm"
              onPress={async () => {
                await createReminder({
                  title: "Routine Checkup",
                  frequency: RISK_FREQUENCY[recommendation.riskLevel!],
                  next_date: recommendation.nextDueDate!,
                  is_active: true,
                });
              }}
            />
          </Card>
        )}

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={isDark ? "#FF2D7A" : "#923D5C"} />
          </View>
        ) : (
          <>
            <Card className="mb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text className={`text-xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
                  Active Reminders
                </Text>
                <Pressable
                  onPress={() => setShowModal(true)}
                  className={`p-2 rounded-xl ${isDark ? "bg-dark-accent-muted active:bg-dark-accent/30" : "bg-primary-light/50 active:bg-primary-light"}`}
                >
                  <Plus size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
                </Pressable>
              </View>

              {activeReminders.length === 0 ? (
                <View className="items-center py-6">
                  <Text className={`font-inter-regular mb-4 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                    Nothing set up yet
                  </Text>
                  <Button
                    label="Add one"
                    variant="secondary"
                    size="sm"
                    onPress={() => setShowModal(true)}
                  />
                </View>
              ) : (
                activeReminders.map((reminder, index) => (
                  <View key={reminder.id}>
                    {index > 0 && <View className={`h-[1px] my-4 ${isDark ? "bg-dark-border" : "bg-border"}`} />}
                    <ReminderItem
                      reminder={reminder}
                      onToggle={() => handleToggleActive(reminder)}
                      onDelete={() => handleDelete(reminder)}
                      onAddToCalendar={() => addToCalendar(reminder.title, new Date(reminder.next_date))}
                      isDark={isDark}
                    />
                  </View>
                ))
              )}
            </Card>

            {inactiveReminders.length > 0 && (
              <>
                <Text className={`text-xl font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
                  Paused Reminders
                </Text>
                <Card className="mb-8 opacity-60">
                  {inactiveReminders.map((reminder, index) => (
                    <View key={reminder.id}>
                      {index > 0 && <View className={`h-[1px] my-4 ${isDark ? "bg-dark-border" : "bg-border"}`} />}
                      <ReminderItem
                        reminder={reminder}
                        onToggle={() => handleToggleActive(reminder)}
                        onDelete={() => handleDelete(reminder)}
                        onAddToCalendar={() => addToCalendar(reminder.title, new Date(reminder.next_date))}
                        isDark={isDark}
                      />
                    </View>
                  ))}
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Reminder Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
          <View className={`flex-row items-center justify-between px-6 py-4 border-b ${isDark ? "border-dark-border" : "border-border"}`}>
            <Pressable
              onPress={() => setShowModal(false)}
              className="p-2 -ml-2"
            >
              <X size={24} color={isDark ? "#FFFFFF" : "#374151"} />
            </Pressable>
            <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              New Reminder
            </Text>
            <View className="w-10" />
          </View>

          <View className="flex-1 px-6 py-6">
            <View className="mb-6">
              <Text className={`font-inter-semibold mb-2 ${isDark ? "text-dark-text" : "text-text"}`}>Title</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g., 3-Month Checkup"
                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                className={`border rounded-2xl px-4 py-4 font-inter-regular ${
                  isDark
                    ? "bg-dark-surface border-dark-border text-dark-text"
                    : "bg-white border-border text-text"
                }`}
              />
            </View>

            <View className="mb-8">
              <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
                Frequency
              </Text>
              <View className="gap-3">
                {FREQUENCY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setNewFrequency(option.value)}
                    className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                      newFrequency === option.value
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
                        newFrequency === option.value
                          ? isDark ? "text-dark-accent" : "text-primary"
                          : isDark ? "text-dark-text" : "text-text"
                      }`}
                    >
                      {option.label}
                    </Text>
                    {newFrequency === option.value && (
                      <CheckCircle2 size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View className={`p-5 rounded-3xl mb-8 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/20"}`}>
              <Text className={`font-inter-medium text-sm ${isDark ? "text-dark-accent" : "text-primary-dark"}`}>
                We'll nudge you on{" "}
                <Text className="font-inter-bold">
                  {formatDate(getNextDate(newFrequency))}
                </Text>
              </Text>
            </View>

            <Button label="Set it" onPress={handleCreateReminder} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ReminderItem({
  reminder,
  onToggle,
  onDelete,
  onAddToCalendar,
  isDark,
}: {
  reminder: Reminder;
  onToggle: () => void;
  onDelete: () => void;
  onAddToCalendar: () => void;
  isDark: boolean;
}) {
  const frequencyLabels: Record<ReminderFrequency, string> = {
    monthly: "Monthly",
    quarterly: "Every 3 months",
    biannual: "Every 6 months",
    annual: "Yearly",
  };

  const isPast = new Date(reminder.next_date) < new Date();

  return (
    <View>
      <View className="flex-row items-start">
        <View
          className={`p-3 rounded-2xl mr-4 ${
            reminder.is_active
              ? isDark ? "bg-dark-accent-muted" : "bg-primary-light"
              : isDark ? "bg-dark-surface-light" : "bg-gray-100"
          }`}
        >
          <Calendar
            size={24}
            color={reminder.is_active ? (isDark ? "#FF2D7A" : "#923D5C") : "#9CA3AF"}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`font-inter-semibold flex-1 ${isDark ? "text-dark-text" : "text-text"}`}>
              {reminder.title}
            </Text>
            {/* Status indicator - icon instead of badge to save space */}
            <View className={`flex-row items-center ml-2 px-2 py-1 rounded-full ${
              reminder.is_active
                ? isPast
                  ? isDark ? "bg-dark-warning-bg" : "bg-warning-light"
                  : isDark ? "bg-dark-success-bg" : "bg-success-light/50"
                : isDark ? "bg-dark-surface-light" : "bg-gray-100"
            }`}>
              <CheckCircle2
                size={12}
                color={
                  reminder.is_active
                    ? isPast ? "#F59E0B" : (isDark ? "#00E5A0" : "#10B981")
                    : "#9CA3AF"
                }
              />
            </View>
          </View>
          <View className="flex-row items-center flex-wrap">
            <Clock size={12} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />
            <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
              {frequencyLabels[reminder.frequency]}
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
          onPress={onDelete}
          className={`flex-row items-center px-3 py-2 rounded-xl ${isDark ? "bg-danger/10 active:bg-danger/20" : "bg-danger/5 active:bg-danger/10"}`}
        >
          <Trash2 size={14} color="#DC3545" />
          <Text className="text-xs font-inter-medium ml-1.5 text-danger">
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
