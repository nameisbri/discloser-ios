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
  Plus,
  Clock,
  CheckCircle2,
  ChevronLeft,
  X,
  Trash2,
  Sparkles,
  AlertTriangle,
} from "lucide-react-native";
import { useReminders, useTestingRecommendations, formatDueMessage } from "../../lib/hooks";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import type { Reminder, ReminderFrequency } from "../../lib/types";

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
  const {
    reminders,
    activeReminders,
    loading,
    refetch,
    createReminder,
    updateReminder,
    deleteReminder,
  } = useReminders();
  const recommendation = useTestingRecommendations();

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
      Alert.alert("Error", "Please enter a title for the reminder");
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
      Alert.alert("Error", "Failed to create reminder");
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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-inter-semibold text-secondary-dark">
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
            tintColor="#923D5C"
          />
        }
      >
        <View className="items-center mb-10 mt-2">
          <View className="w-20 h-20 bg-warning-light rounded-full items-center justify-center mb-6">
            <Bell size={40} color="#FFC107" />
          </View>
          <Text className="text-3xl font-inter-bold text-secondary-dark mb-3">
            Testing Schedule
          </Text>
          <Text className="text-text-light font-inter-regular text-center">
            Stay on top of your sexual health with personalized reminders.
          </Text>
        </View>

        {/* Testing Overdue Alert */}
        {(recommendation.isOverdue || recommendation.isDueSoon) && (
          <Card className="mb-6 border-2 border-warning" style={{ backgroundColor: "#FEF3C7" }}>
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: "#FDE68A" }}
              >
                <AlertTriangle size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-warning-dark font-inter-bold text-sm">
                  {formatDueMessage(recommendation)}
                </Text>
                <Text className="text-warning-dark/70 font-inter-regular text-xs mt-0.5">
                  Based on your {recommendation.riskLevel} risk assessment
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Suggested Reminder based on risk */}
        {recommendation.riskLevel && recommendation.nextDueDate && activeReminders.length === 0 && (
          <Card className="mb-6 bg-primary-light/30 border-2 border-primary/20">
            <View className="flex-row items-center mb-3">
              <Sparkles size={18} color="#923D5C" />
              <Text className="text-primary font-inter-bold ml-2">Suggested for you</Text>
            </View>
            <Text className="text-text font-inter-medium mb-3">
              Based on your {recommendation.riskLevel} risk level, we recommend testing{" "}
              {recommendation.intervalDays === 365 ? "yearly" : recommendation.intervalDays === 180 ? "every 6 months" : "every 3 months"}.
            </Text>
            <Text className="text-text-light text-sm mb-4">
              Next suggested date: {formatDate(recommendation.nextDueDate)}
            </Text>
            <Button
              label="Create Suggested Reminder"
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
            <ActivityIndicator size="large" color="#923D5C" />
          </View>
        ) : (
          <>
            <Card className="mb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-inter-bold text-secondary-dark">
                  Active Reminders
                </Text>
                <Pressable
                  onPress={() => setShowModal(true)}
                  className="bg-primary-light/50 p-2 rounded-xl active:bg-primary-light"
                >
                  <Plus size={20} color="#923D5C" />
                </Pressable>
              </View>

              {activeReminders.length === 0 ? (
                <View className="items-center py-6">
                  <Text className="text-text-light font-inter-regular mb-4">
                    No active reminders
                  </Text>
                  <Button
                    label="Create Reminder"
                    variant="secondary"
                    size="sm"
                    onPress={() => setShowModal(true)}
                  />
                </View>
              ) : (
                activeReminders.map((reminder, index) => (
                  <View key={reminder.id}>
                    {index > 0 && <View className="h-[1px] bg-border my-4" />}
                    <ReminderItem
                      reminder={reminder}
                      onToggle={() => handleToggleActive(reminder)}
                      onDelete={() => handleDelete(reminder)}
                    />
                  </View>
                ))
              )}
            </Card>

            {inactiveReminders.length > 0 && (
              <>
                <Text className="text-xl font-inter-bold text-secondary-dark mb-4">
                  Paused Reminders
                </Text>
                <Card className="mb-8 opacity-60">
                  {inactiveReminders.map((reminder, index) => (
                    <View key={reminder.id}>
                      {index > 0 && <View className="h-[1px] bg-border my-4" />}
                      <ReminderItem
                        reminder={reminder}
                        onToggle={() => handleToggleActive(reminder)}
                        onDelete={() => handleDelete(reminder)}
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
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
            <Pressable
              onPress={() => setShowModal(false)}
              className="p-2 -ml-2"
            >
              <X size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-inter-semibold text-secondary-dark">
              New Reminder
            </Text>
            <View className="w-10" />
          </View>

          <View className="flex-1 px-6 py-6">
            <View className="mb-6">
              <Text className="text-text font-inter-semibold mb-2">Title</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g., 3-Month Checkup"
                className="bg-white border border-border rounded-2xl px-4 py-4 font-inter-regular text-text"
              />
            </View>

            <View className="mb-8">
              <Text className="text-text font-inter-semibold mb-3">
                Frequency
              </Text>
              <View className="gap-3">
                {FREQUENCY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setNewFrequency(option.value)}
                    className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                      newFrequency === option.value
                        ? "bg-primary-light/30 border-primary"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`font-inter-medium ${
                        newFrequency === option.value
                          ? "text-primary"
                          : "text-text"
                      }`}
                    >
                      {option.label}
                    </Text>
                    {newFrequency === option.value && (
                      <CheckCircle2 size={20} color="#923D5C" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="bg-primary-light/20 p-5 rounded-3xl mb-8">
              <Text className="text-primary-dark font-inter-medium text-sm">
                Next reminder will be set for:{" "}
                <Text className="font-inter-bold">
                  {formatDate(getNextDate(newFrequency))}
                </Text>
              </Text>
            </View>

            <Button label="Create Reminder" onPress={handleCreateReminder} />
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
}: {
  reminder: Reminder;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const frequencyLabels: Record<ReminderFrequency, string> = {
    monthly: "Monthly",
    quarterly: "Every 3 months",
    biannual: "Every 6 months",
    annual: "Yearly",
  };

  const isPast = new Date(reminder.next_date) < new Date();

  return (
    <View className="flex-row items-center">
      <View
        className={`p-3 rounded-2xl mr-4 ${
          reminder.is_active ? "bg-primary-light" : "bg-gray-100"
        }`}
      >
        <Calendar
          size={24}
          color={reminder.is_active ? "#923D5C" : "#9CA3AF"}
        />
      </View>
      <View className="flex-1">
        <Text className="text-text font-inter-semibold mb-1">
          {reminder.title}
        </Text>
        <View className="flex-row items-center">
          <Clock size={12} color="#6B7280" />
          <Text className="text-text-light text-xs font-inter-regular ml-1">
            {frequencyLabels[reminder.frequency]} • Next:{" "}
            {formatDate(reminder.next_date)}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <Badge
          label={
            reminder.is_active ? (isPast ? "Overdue" : "Active") : "Paused"
          }
          variant={
            reminder.is_active ? (isPast ? "warning" : "success") : "outline"
          }
        />
        <Pressable onPress={onDelete} className="p-2">
          <Trash2 size={16} color="#DC3545" />
        </Pressable>
      </View>
    </View>
  );
}
