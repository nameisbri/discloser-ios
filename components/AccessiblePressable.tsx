import React from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
  AccessibilityRole,
} from "react-native";
import { hapticImpact, ImpactStyle } from "../lib/utils/haptics";

/**
 * Minimum touch target size per iOS HIG and WCAG 2.5.5
 */
const MIN_TOUCH_SIZE = 44;

interface AccessiblePressableProps extends Omit<PressableProps, "style"> {
  /**
   * Required accessibility label describing the element
   */
  accessibilityLabel: string;

  /**
   * Optional hint describing what happens on interaction
   */
  accessibilityHint?: string;

  /**
   * Accessibility role for the element
   * @default "button"
   */
  accessibilityRole?: AccessibilityRole;

  /**
   * Minimum touch target size in points
   * @default 44
   */
  minTouchSize?: number;

  /**
   * Haptic feedback style on press, or "none" to disable
   * @default "light"
   */
  hapticStyle?: ImpactStyle | "none";

  /**
   * Children to render inside the pressable
   */
  children: React.ReactNode;

  /**
   * Style for the pressable container
   */
  style?: ViewStyle;

  /**
   * Additional className for NativeWind styling
   */
  className?: string;
}

/**
 * AccessiblePressable - A Pressable wrapper that enforces accessibility best practices
 *
 * Features:
 * - Enforces minimum 44x44 touch target (iOS HIG / WCAG 2.5.5)
 * - Requires accessibility label
 * - Includes haptic feedback by default
 * - Supports hitSlop for extending touch area without visual change
 *
 * @example
 * <AccessiblePressable
 *   accessibilityLabel="Delete file"
 *   accessibilityHint="Removes this file from upload"
 *   hapticStyle="heavy"
 *   onPress={handleDelete}
 * >
 *   <TrashIcon />
 * </AccessiblePressable>
 */
export function AccessiblePressable({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
  minTouchSize = MIN_TOUCH_SIZE,
  hapticStyle = "light",
  children,
  style,
  className,
  onPress,
  disabled,
  hitSlop,
  ...props
}: AccessiblePressableProps) {
  const handlePress = async (event: any) => {
    if (disabled) return;

    // Trigger haptic feedback before the action
    if (hapticStyle !== "none") {
      await hapticImpact(hapticStyle);
    }

    onPress?.(event);
  };

  // Calculate hitSlop to ensure minimum touch target
  // If content is smaller than minTouchSize, expand the touch area
  const calculatedHitSlop =
    typeof hitSlop === "number"
      ? hitSlop
      : hitSlop || {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: disabled || false }}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={calculatedHitSlop}
      style={[styles.minTouchTarget(minTouchSize), style]}
      className={className}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = {
  minTouchTarget: (size: number): ViewStyle => ({
    minWidth: size,
    minHeight: size,
    alignItems: "center",
    justifyContent: "center",
  }),
};

export default AccessiblePressable;
