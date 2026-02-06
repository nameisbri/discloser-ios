import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, PlusCircle, BookOpen, Settings } from "lucide-react-native";
import { useTheme } from "../context/theme";
import { hapticSelection } from "../lib/utils/haptics";

type TabName = "dashboard" | "upload" | "resources" | "settings";

interface TabBarProps {
  /**
   * Currently active tab
   */
  activeTab: TabName;

  /**
   * Callback when a tab is pressed
   */
  onTabPress: (tab: TabName) => void;
}

interface TabConfig {
  name: TabName;
  label: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
}

const tabs: TabConfig[] = [
  {
    name: "dashboard",
    label: "Home",
    icon: ({ color, size }) => <Home size={size} color={color} />,
  },
  {
    name: "upload",
    label: "Add",
    icon: ({ color, size }) => <PlusCircle size={size} color={color} />,
  },
  {
    name: "resources",
    label: "Resources",
    icon: ({ color, size }) => <BookOpen size={size} color={color} />,
  },
  {
    name: "settings",
    label: "Settings",
    icon: ({ color, size }) => <Settings size={size} color={color} />,
  },
];

/**
 * TabBar - Bottom navigation component
 *
 * Features:
 * - Four tabs: Home, Add (Upload), Resources, Settings
 * - Active tab indicator with brand colors
 * - Haptic feedback on tab switch
 * - Full accessibility support
 * - Safe area handling for notch/home indicator
 */
export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleTabPress = async (tab: TabName) => {
    if (tab !== activeTab) {
      await hapticSelection();
      onTabPress(tab);
    }
  };

  const activeColor = isDark ? "#FF2D7A" : "#923D5C";
  const inactiveColor = isDark ? "rgba(255, 255, 255, 0.5)" : "#9CA3AF";

  return (
    <View
      className={`flex-row border-t ${
        isDark
          ? "bg-dark-surface border-dark-border"
          : "bg-background-card border-border"
      }`}
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.name === activeTab;
        const color = isActive ? activeColor : inactiveColor;

        return (
          <Pressable
            key={tab.name}
            onPress={() => handleTabPress(tab.name)}
            className="flex-1 items-center pt-3 pb-2"
            style={{ minHeight: 44 }}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            accessibilityHint={`Navigate to ${tab.label}`}
          >
            {/* Active indicator */}
            {isActive && (
              <View
                className={`absolute top-0 w-12 h-0.5 rounded-full ${
                  isDark ? "bg-dark-accent" : "bg-primary"
                }`}
              />
            )}

            {/* Icon */}
            <View className="mb-1">
              {tab.icon({ color, size: 24 })}
            </View>

            {/* Label */}
            <Text
              className={`text-xs font-inter-medium ${
                isActive
                  ? isDark
                    ? "text-dark-accent"
                    : "text-primary"
                  : isDark
                  ? "text-dark-text-muted"
                  : "text-text-muted"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default TabBar;
