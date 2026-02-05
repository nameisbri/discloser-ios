import * as Calendar from "expo-calendar";
import { Platform, Alert } from "react-native";
import { logger } from "./utils/logger";

/**
 * Request calendar permissions
 * @returns true if permissions granted, false otherwise
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

/**
 * Get the default calendar ID for the platform
 * Creates a new calendar if none exists
 */
async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Find the default calendar
  const defaultCalendar = calendars.find(
    (cal) =>
      cal.allowsModifications &&
      (Platform.OS === "ios"
        ? cal.source?.name === "iCloud" || cal.source?.name === "Default"
        : cal.isPrimary)
  );

  if (defaultCalendar) {
    return defaultCalendar.id;
  }

  // Fall back to any calendar that allows modifications
  const writableCalendar = calendars.find((cal) => cal.allowsModifications);
  if (writableCalendar) {
    return writableCalendar.id;
  }

  // Create a new calendar if needed (Android only)
  if (Platform.OS === "android") {
    const newCalendarId = await Calendar.createCalendarAsync({
      title: "Discloser Reminders",
      color: "#923D5C",
      entityType: Calendar.EntityTypes.EVENT,
      source: {
        isLocalAccount: true,
        name: "Discloser",
        type: Calendar.SourceType.LOCAL,
      },
      name: "Discloser Reminders",
      ownerAccount: "Discloser",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    return newCalendarId;
  }

  return null;
}

/**
 * Add a reminder to the device calendar
 * @param title - Event title (e.g., "Routine Checkup")
 * @param date - Event date
 * @param frequency - Optional frequency label (e.g., "Every 3 months")
 * @returns true if event was created, false otherwise
 */
export async function addToCalendar(
  title: string,
  date: Date,
  frequency?: string
): Promise<boolean> {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Calendar Access Required",
        "Please enable calendar access in Settings to add reminders to your calendar.",
        [{ text: "OK" }]
      );
      return false;
    }

    const calendarId = await getDefaultCalendarId();
    if (!calendarId) {
      Alert.alert(
        "No Calendar Found",
        "Could not find a calendar to add the event to.",
        [{ text: "OK" }]
      );
      return false;
    }

    // Create an all-day event
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0); // Set to 9 AM

    const endDate = new Date(startDate);
    endDate.setHours(10, 0, 0, 0); // 1 hour event

    // Build descriptive notes for the calendar event
    const notesLines = [
      "🩺 STI/STD Testing Reminder",
      "",
      "Time to get tested! Regular testing is an important part of taking care of your sexual health.",
    ];
    if (frequency) {
      notesLines.push("", `📅 Frequency: ${frequency}`);
    }
    notesLines.push("", "Added from Discloser app");

    await Calendar.createEventAsync(calendarId, {
      title: `🩺 ${title}`,
      startDate,
      endDate,
      notes: notesLines.join("\n"),
      alarms: [
        { relativeOffset: -1440 }, // 1 day before
        { relativeOffset: -60 }, // 1 hour before
      ],
    });

    Alert.alert(
      "Added to Calendar",
      `"${title}" has been added to your calendar for ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
      [{ text: "Nice!" }]
    );

    return true;
  } catch (error) {
    logger.error("Failed to add to calendar", { error });
    Alert.alert(
      "Couldn't Add to Calendar",
      "Something went wrong. Please try again or add the event manually.",
      [{ text: "OK" }]
    );
    return false;
  }
}
