import { View, Text } from "react-native";
import { FileText, ShieldCheck, Share2 } from "lucide-react-native";
import { Button } from "../Button";

interface EmptyDashboardStateProps {
  isDark: boolean;
  onUpload: () => void;
}

const NEXT_STEPS = [
  { icon: FileText, label: "Upload a photo or PDF", color: "#923D5C", darkColor: "#FF2D7A" },
  { icon: ShieldCheck, label: "AI verifies your results", color: "#10B981", darkColor: "#00E5A0" },
  { icon: Share2, label: "Share with confidence", color: "#7C3AED", darkColor: "#C9A0DC" },
];

export function EmptyDashboardState({
  isDark,
  onUpload,
}: EmptyDashboardStateProps) {
  return (
    <View className="items-center py-16 px-6">
      <View
        className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
          isDark ? "bg-dark-accent-muted" : "bg-primary-light"
        }`}
      >
        <FileText size={48} color={isDark ? "#FF2D7A" : "#923D5C"} />
      </View>

      <Text
        className={`text-xl font-inter-bold text-center ${
          isDark ? "text-dark-text" : "text-text"
        }`}
      >
        Add your first test result
      </Text>

      <Text
        className={`text-sm font-inter-regular text-center mt-2 ${
          isDark ? "text-dark-text-secondary" : "text-text-light"
        }`}
      >
        Your results stay private until you decide to share
      </Text>

      <Button
        label="Upload a Result"
        variant="primary"
        onPress={onUpload}
        className="mt-6 w-full"
        accessibilityHint="Opens the upload screen to add a test result"
      />

      {/* What happens next steps */}
      <View className={`mt-8 w-full rounded-2xl p-4 ${isDark ? "bg-dark-surface" : "bg-gray-50"}`}>
        <Text className={`text-xs font-inter-semibold uppercase tracking-wider mb-3 ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>
          What happens next
        </Text>
        <View className="gap-3">
          {NEXT_STEPS.map((step, i) => {
            const Icon = step.icon;
            const iconColor = isDark ? step.darkColor : step.color;
            return (
              <View key={step.label} className="flex-row items-center">
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: iconColor + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Icon size={14} color={iconColor} />
                </View>
                <Text className={`text-sm font-inter-medium flex-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
