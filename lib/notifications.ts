import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_KEY = "notifications_enabled";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Testing Reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    // Fails in Expo Go - requires development build
    console.log("Push token registration skipped (Expo Go or missing projectId)");
    return null;
  }
}

export async function scheduleReminderNotification(
  reminderId: string,
  title: string,
  nextDate: Date
): Promise<string | null> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return null;

  // Cancel existing notification for this reminder
  await cancelReminderNotification(reminderId);

  // Don't schedule if date is in the past
  if (nextDate <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Testing Reminder",
      body: title,
      data: { reminderId },
    },
    trigger: { type: "date", date: nextDate },
    identifier: `reminder-${reminderId}`,
  });

  return id;
}

export async function cancelReminderNotification(reminderId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`reminder-${reminderId}`);
  } catch {
    // Notification may not exist
  }
}

export async function cancelAllReminderNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  return value !== "false"; // Default to true
}

export async function setNotificationsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(enabled));
  if (!enabled) {
    await cancelAllReminderNotifications();
  }
}
