import { View, Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";

interface UploadOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  isDark: boolean;
}

export function UploadOption({
  icon,
  title,
  description,
  onPress,
  isDark,
}: UploadOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`p-5 rounded-2xl border-2 flex-row items-center ${
        isDark
          ? "bg-dark-surface border-dark-border active:border-dark-accent active:bg-dark-surface-light"
          : "bg-background-card border-border active:border-primary active:bg-primary-muted"
      }`}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityHint={description}
    >
      <View className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${isDark ? "bg-dark-surface-light" : "bg-primary-muted"}`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`text-base font-inter-bold mb-0.5 ${isDark ? "text-dark-text" : "text-text"}`}>
          {title}
        </Text>
        <Text className={`font-inter-regular text-sm ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
          {description}
        </Text>
      </View>
      <ChevronLeft size={20} color={isDark ? "#3D3548" : "#E5E7EB"} style={{ transform: [{ rotate: '180deg' }] }} />
    </Pressable>
  );
}
