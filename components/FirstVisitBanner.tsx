import { useRef, useEffect } from "react";
import { View, Text, Pressable, Animated, Easing, AccessibilityInfo } from "react-native";
import { X } from "lucide-react-native";

interface FirstVisitBannerProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  isDark: boolean;
  onDismiss: () => void;
}

export function FirstVisitBanner({ icon, title, message, isDark, onDismiss }: FirstVisitBannerProps) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        translateY.setValue(0);
        opacity.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginBottom: 16,
      }}
    >
      <View
        className={`flex-row items-start p-4 rounded-2xl ${isDark ? "bg-dark-surface" : "bg-white"}`}
        style={{ borderWidth: 1, borderColor: isDark ? "#2D2438" : "#E5E7EB" }}
        accessibilityRole="alert"
      >
        <View className="mr-3 mt-0.5">{icon}</View>
        <View className="flex-1">
          <Text className={`font-inter-semibold text-sm ${isDark ? "text-dark-text" : "text-text"}`}>
            {title}
          </Text>
          <Text className={`font-inter-regular text-sm mt-0.5 leading-5 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
            {message}
          </Text>
        </View>
        <Pressable
          onPress={onDismiss}
          className="p-1 -mr-1 -mt-1"
          accessibilityLabel="Dismiss banner"
          accessibilityRole="button"
          hitSlop={8}
        >
          <X size={16} color={isDark ? "#6B6B6B" : "#9CA3AF"} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
