import React, { useEffect, useRef } from "react";
import { View, Animated, ViewStyle, AccessibilityInfo } from "react-native";
import { useTheme } from "../context/theme";

interface SkeletonLoaderProps {
  /**
   * Width of the skeleton (number for pixels, string for flex/percentage)
   */
  width?: number | string;

  /**
   * Height of the skeleton in pixels
   */
  height?: number;

  /**
   * Border radius of the skeleton
   */
  borderRadius?: number;

  /**
   * Additional style overrides
   */
  style?: ViewStyle;

  /**
   * Additional className for NativeWind
   */
  className?: string;
}

/**
 * SkeletonLoader - Animated placeholder for loading states
 *
 * Features:
 * - Smooth shimmer animation
 * - Theme-aware colors
 * - Respects reduced motion preferences
 * - Hidden from screen readers
 */
export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
  className,
}: SkeletonLoaderProps) {
  const { isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    // Check for reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then((isReduced) => {
      reduceMotionRef.current = isReduced;

      if (!isReduced) {
        // Start shimmer animation
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        animation.start();

        return () => animation.stop();
      }
    });
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const backgroundColor = isDark ? "#2D2438" : "#E5E7EB";

  return (
    <Animated.View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity: reduceMotionRef.current ? 0.5 : opacity,
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/**
 * SkeletonText - Pre-configured skeleton for text lines
 */
export function SkeletonText({
  width = "100%",
  lines = 1,
  lineHeight = 16,
  spacing = 8,
  lastLineWidth = "60%",
}: {
  width?: number | string;
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: number | string;
}) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : width}
          height={lineHeight}
          borderRadius={4}
          style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
}

/**
 * SkeletonAvatar - Pre-configured skeleton for circular avatars
 */
export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius={size / 2}
    />
  );
}

/**
 * SkeletonCard - Pre-configured skeleton matching ResultCard layout
 */
export function SkeletonCard() {
  const { isDark } = useTheme();

  return (
    <View
      className={`rounded-2xl p-5 border flex-row items-center ${
        isDark
          ? "bg-dark-surface border-dark-border"
          : "bg-background-card border-border"
      }`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Icon placeholder */}
      <SkeletonLoader
        width={48}
        height={48}
        borderRadius={16}
        style={{ marginRight: 16 }}
      />

      {/* Text content */}
      <View style={{ flex: 1 }}>
        <SkeletonLoader
          width="70%"
          height={18}
          borderRadius={4}
          style={{ marginBottom: 8 }}
        />
        <SkeletonLoader
          width="40%"
          height={14}
          borderRadius={4}
        />
      </View>

      {/* Status badge */}
      <SkeletonLoader
        width={70}
        height={28}
        borderRadius={14}
      />
    </View>
  );
}

/**
 * SkeletonResultsList - Multiple skeleton cards for list loading
 */
export function SkeletonResultsList({ count = 3 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading results" accessibilityRole="progressbar">
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: 12 }}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

export default SkeletonLoader;
