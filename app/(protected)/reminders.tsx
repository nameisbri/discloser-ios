import { View, Text, SafeAreaView, Pressable, ScrollView } from "react-native";
import { Bell, Calendar, Plus, Clock, CheckCircle2 } from "lucide-react-native";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";

export default function Reminders() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="items-center mb-10 mt-6">
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

        <Card className="mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-inter-bold text-secondary-dark">
              Active Reminders
            </Text>
            <Pressable className="bg-primary-light/50 p-2 rounded-xl active:bg-primary-light">
              <Plus size={20} color="#923D5C" />
            </Pressable>
          </View>

          <ReminderItem
            title="3-Month Routine Checkup"
            date="March 15, 2026"
            frequency="Every 3 months"
            active
          />
          <View className="h-[1px] bg-border my-4" />
          <ReminderItem
            title="Annual Full Panel"
            date="Dec 12, 2026"
            frequency="Yearly"
            active
          />
        </Card>

        <Text className="text-xl font-inter-bold text-secondary-dark mb-4">
          Past Reminders
        </Text>
        <Card className="mb-12 opacity-60">
          <View className="flex-row items-center">
            <View className="bg-success-light p-3 rounded-2xl mr-4">
              <CheckCircle2 size={24} color="#28A745" />
            </View>
            <View className="flex-1">
              <Text className="text-text font-inter-semibold">
                Dec 12, 2025 Checkup
              </Text>
              <Text className="text-text-light text-sm font-inter-regular">
                Completed on Dec 15, 2025
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReminderItem({
  title,
  date,
  frequency,
  active,
}: {
  title: string;
  date: string;
  frequency: string;
  active: boolean;
}) {
  return (
    <View className="flex-row items-center">
      <View className="bg-primary-light p-3 rounded-2xl mr-4">
        <Calendar size={24} color="#923D5C" />
      </View>
      <View className="flex-1">
        <Text className="text-text font-inter-semibold mb-1">{title}</Text>
        <View className="flex-row items-center">
          <Clock size={12} color="#6B7280" />
          <Text className="text-text-light text-xs font-inter-regular ml-1">
            {frequency} • Next: {date}
          </Text>
        </View>
      </View>
      <Badge label="Active" variant="success" />
    </View>
  );
}
