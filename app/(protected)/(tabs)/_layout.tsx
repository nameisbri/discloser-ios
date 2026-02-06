import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, PlusCircle, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/theme";
import { hapticSelection } from "../../../lib/utils/haptics";

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
          backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
          borderTopColor: isDark ? "#2D2D2D" : "#E5E5E5",
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
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          tabBarAccessibilityLabel: "Home tab",
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
          tabBarAccessibilityLabel: "Add result tab",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
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
