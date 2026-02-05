import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isValidFutureDate, getNotificationDate } from "./utils/notifications";
import { logger } from "./utils/logger";
import { supabase } from "./supabase";
import type { Reminder } from "./types";

const NOTIFICATIONS_KEY = "notifications_enabled";

// Tracks if a sync is in progress to prevent concurrent operations
let syncInProgress = false;

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      logger.info("Push notifications require a physical device");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    const wasAlreadyGranted = existingStatus === "granted";

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

    // Sync notifications if permission was just granted
    // This ensures existing reminders get their notifications scheduled
    if (!wasAlreadyGranted) {
      await syncReminderNotifications();
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    // Fails in Expo Go - requires development build
    logger.info("Push token registration skipped (Expo Go or missing projectId)");
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

  // Don't schedule if date is in the past (must be at least 1 minute in future)
  if (!isValidFutureDate(nextDate)) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Testing Reminder",
      body: title,
      data: { reminderId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextDate },
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

/**
 * Result of a notification sync operation
 */
export interface SyncResult {
  success: boolean;
  scheduled: number;
  skipped: number;
  error?: string;
}

/**
 * Sync all scheduled notifications with active reminders from the database.
 *
 * This function should be called:
 * 1. On app launch (after user is authenticated)
 * 2. After notification permissions are granted
 *
 * The sync process:
 * 1. Check if notifications are enabled
 * 2. Fetch all active reminders for the current user
 * 3. Cancel all existing scheduled notifications (clean slate)
 * 4. Schedule notifications for each active reminder with a future date
 */
export async function syncReminderNotifications(): Promise<SyncResult> {
  // Prevent concurrent sync operations
  if (syncInProgress) {
    logger.info("Notification sync skipped: sync already in progress");
    return { success: true, scheduled: 0, skipped: 0 };
  }

  syncInProgress = true;

  try {
    // Check if notifications are enabled in app settings
    const enabled = await getNotificationsEnabled();
    if (!enabled) {
      logger.info("Notification sync skipped: notifications disabled");
      return { success: true, scheduled: 0, skipped: 0 };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.info("Notification sync skipped: no user logged in");
      return { success: true, scheduled: 0, skipped: 0 };
    }

    // Fetch active reminders
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      logger.error("Notification sync failed: database error", { error: error.message });
      return { success: false, scheduled: 0, skipped: 0, error: error.message };
    }

    if (!reminders || reminders.length === 0) {
      logger.info("Notification sync: no active reminders");
      await cancelAllReminderNotifications();
      return { success: true, scheduled: 0, skipped: 0 };
    }

    // Cancel all existing notifications before rescheduling
    await cancelAllReminderNotifications();

    let scheduled = 0;
    let skipped = 0;

    // Schedule notifications for each reminder
    for (const reminder of reminders as Reminder[]) {
      try {
        const notificationDate = getNotificationDate(reminder.next_date);

        if (!isValidFutureDate(notificationDate)) {
          skipped++;
          continue;
        }

        const notificationId = await scheduleReminderNotification(
          reminder.id,
          reminder.title,
          notificationDate
        );

        if (notificationId) {
          scheduled++;
        } else {
          skipped++;
        }
      } catch {
        // If scheduling fails for one reminder, continue with others
        skipped++;
      }
    }

    logger.info("Notification sync complete", { scheduled, skipped });
    return { success: true, scheduled, skipped };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Notification sync failed", { error: message });
    return { success: false, scheduled: 0, skipped: 0, error: message };
  } finally {
    syncInProgress = false;
  }
}
