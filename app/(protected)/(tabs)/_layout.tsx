import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, PlusCircle, BookOpen, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/theme";
import { hapticSelection } from "../../../lib/utils/haptics";

function TabIcon({
  Icon,
  color,
  size,
  focused,
  isDark,
}: {
  Icon: typeof Home;
  color: string;
  size: number;
  focused: boolean;
  isDark: boolean;
}) {
  return (
    <View style={{ alignItems: "center", position: "relative" }}>
      {focused && (
        <View
          style={{
            position: "absolute",
            top: -14,
            width: 48,
            height: 2,
            borderRadius: 1,
            backgroundColor: isDark ? "#FF2D7A" : "#923D5C",
          }}
        />
      )}
      <Icon size={size} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const activeColor = isDark ? "#FF2D7A" : "#923D5C";
  const inactiveColor = isDark ? "rgba(255, 255, 255, 0.5)" : "#9CA3AF";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#1A1520" : "#FFFFFF",
          borderTopColor: isDark ? "#52495D" : "#E5E7EB",
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 8),
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontFamily: "Inter-Medium",
          fontSize: 12,
        },
      }}
      screenListeners={{
        tabPress: async () => {
          await hapticSelection();
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={Home} color={color} size={size} focused={focused} isDark={isDark} />
          ),
          tabBarAccessibilityLabel: "Home tab",
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={PlusCircle} color={color} size={size} focused={focused} isDark={isDark} />
          ),
          tabBarAccessibilityLabel: "Add result tab",
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: "Resources",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={BookOpen} color={color} size={size} focused={focused} isDark={isDark} />
          ),
          tabBarAccessibilityLabel: "Resources tab",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={Settings} color={color} size={size} focused={focused} isDark={isDark} />
          ),
          tabBarAccessibilityLabel: "Settings tab",
        }}
      />
      <Tabs.Screen
        name="results/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="reminders"
        options={{ href: null }}
      />
    </Tabs>
  );
}
