import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Haptic feedback utility functions
 * Provides consistent haptic feedback across the app with platform checks
 */

export type ImpactStyle = "light" | "medium" | "heavy";
export type NotificationType = "success" | "warning" | "error";

/**
 * Trigger impact haptic feedback
 * Use for button presses and UI interactions
 *
 * @param style - The intensity of the impact (light, medium, heavy)
 *
 * @example
 * hapticImpact("light")  // Subtle feedback for minor actions
 * hapticImpact("medium") // Standard button press feedback
 * hapticImpact("heavy")  // Strong feedback for important/destructive actions
 */
export async function hapticImpact(style: ImpactStyle = "medium"): Promise<void> {
  if (Platform.OS === "web") return;

  const styleMap: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };

  try {
    await Haptics.impactAsync(styleMap[style]);
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Trigger selection haptic feedback
 * Use for selection changes, toggles, and picker changes
 *
 * @example
 * hapticSelection() // When user toggles a switch
 * hapticSelection() // When user selects from a list
 */
export async function hapticSelection(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await Haptics.selectionAsync();
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Trigger notification haptic feedback
 * Use for success confirmations, warnings, and errors
 *
 * @param type - The type of notification (success, warning, error)
 *
 * @example
 * hapticNotification("success") // After saving data successfully
 * hapticNotification("warning") // Before destructive action confirmation
 * hapticNotification("error")   // When an error occurs
 */
export async function hapticNotification(type: NotificationType): Promise<void> {
  if (Platform.OS === "web") return;

  const typeMap: Record<NotificationType, Haptics.NotificationFeedbackType> = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  };

  try {
    await Haptics.notificationAsync(typeMap[type]);
  } catch {
    // Silently fail if haptics not available
  }
}
