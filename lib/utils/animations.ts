import { useEffect, useRef, useState } from "react";
import { Animated, AccessibilityInfo, Easing } from "react-native";

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if user has enabled "Reduce Motion" in system settings
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial value
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => subscription?.remove();
  }, []);

  return reduceMotion;
}

/**
 * Spring animation configuration for micro-interactions
 */
export const SPRING_CONFIG = {
  fast: { tension: 300, friction: 10 },
  medium: { tension: 200, friction: 15 },
  slow: { tension: 120, friction: 20 },
};

/**
 * Hook for press scale animation with spring physics
 */
export function usePressAnimation(reduceMotion: boolean) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (reduceMotion) return;

    Animated.spring(scale, {
      toValue: 0.96,
      ...SPRING_CONFIG.fast,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;

    Animated.spring(scale, {
      toValue: 1,
      ...SPRING_CONFIG.medium,
      useNativeDriver: true,
    }).start();
  };

  return { scale, handlePressIn, handlePressOut };
}

/**
 * Hook for entrance animation (fade + slide up)
 */
export function useEntranceAnimation(reduceMotion: boolean, delay = 0) {
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;

  useEffect(() => {
    if (reduceMotion) return;

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [reduceMotion, delay, opacity, translateY]);

  return { opacity, translateY };
}

/**
 * Hook for staggered list entrance animation
 */
export function useStaggeredEntrance(
  reduceMotion: boolean,
  index: number,
  staggerDelay = 50
) {
  return useEntranceAnimation(reduceMotion, index * staggerDelay);
}

/**
 * Hook for pulse animation (loading states)
 */
export function usePulseAnimation(reduceMotion: boolean, active: boolean) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion || !active) {
      opacity.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [reduceMotion, active, opacity]);

  return opacity;
}
