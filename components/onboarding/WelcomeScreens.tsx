import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Share2, ShieldCheck, FileText } from "lucide-react-native";
import { Button } from "../Button";

interface WelcomeScreen {
  iconBg: { light: string; dark: string };
  title: string;
  subtitle: string;
}

const SCREENS: WelcomeScreen[] = [
  {
    iconBg: { light: "bg-primary-light", dark: "bg-dark-accent-muted" },
    title: "Share on your terms",
    subtitle:
      "Control exactly what you share, with whom, and for how long. Your status, your rules.",
  },
  {
    iconBg: { light: "bg-green-100", dark: "bg-dark-success-bg" },
    title: "Privacy built in",
    subtitle:
      "Your data stays on your device. Documents are processed locally and never stored on our servers.",
  },
  {
    iconBg: { light: "bg-purple-100", dark: "bg-dark-lavender/20" },
    title: "Upload and verify",
    subtitle:
      "Snap a photo of your lab results and we'll extract the details automatically. Verified results build trust.",
  },
];

const ICON_COLORS = {
  light: ["#923D5C", "#10B981", "#7C3AED"],
  dark: ["#FF2D7A", "#00E5A0", "#C9A0DC"],
};

interface WelcomeScreensProps {
  isDark: boolean;
  onComplete: () => void;
}

export function WelcomeScreens({ isDark, onComplete }: WelcomeScreensProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < SCREENS.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const screen = SCREENS[currentScreen];
  const iconColor = isDark
    ? ICON_COLORS.dark[currentScreen]
    : ICON_COLORS.light[currentScreen];

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-dark-base" : "bg-background"}`}
    >
      <View className="flex-1 justify-center items-center px-8">
        {/* Icon */}
        <View
          className={`w-28 h-28 rounded-full items-center justify-center mb-8 ${
            isDark ? screen.iconBg.dark : screen.iconBg.light
          }`}
        >
          <View>
            {currentScreen === 0 && (
              <Share2 size={48} color={iconColor} />
            )}
            {currentScreen === 1 && (
              <ShieldCheck size={48} color={iconColor} />
            )}
            {currentScreen === 2 && (
              <FileText size={48} color={iconColor} />
            )}
          </View>
        </View>

        {/* Title */}
        <Text
          className={`text-3xl font-inter-bold text-center mb-4 ${
            isDark ? "text-dark-text" : "text-text"
          }`}
        >
          {screen.title}
        </Text>

        {/* Subtitle */}
        <Text
          className={`text-base font-inter-regular text-center leading-6 ${
            isDark ? "text-dark-text-secondary" : "text-text-light"
          }`}
        >
          {screen.subtitle}
        </Text>
      </View>

      {/* Bottom section: dots + button */}
      <View className="px-6 pb-4">
        {/* Dot indicators */}
        <View className="flex-row justify-center mb-6 gap-2">
          {SCREENS.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentScreen
                  ? `w-6 ${isDark ? "bg-dark-accent" : "bg-primary"}`
                  : `w-2 ${isDark ? "bg-dark-surface-light" : "bg-gray-300"}`
              }`}
            />
          ))}
        </View>

        <Button
          label={currentScreen === SCREENS.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
        />

        {currentScreen < SCREENS.length - 1 && (
          <Pressable onPress={onComplete} className="mt-3 py-2">
            <Text
              className={`text-center font-inter-medium ${
                isDark ? "text-dark-text-muted" : "text-text-light"
              }`}
            >
              Skip
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
