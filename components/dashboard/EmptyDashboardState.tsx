import { View, Text } from "react-native";
import { FileText } from "lucide-react-native";
import { Button } from "../Button";

interface EmptyDashboardStateProps {
  isDark: boolean;
  onUpload: () => void;
}

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

      <Text
        className={`text-xs font-inter-regular text-center mt-3 ${
          isDark ? "text-dark-text-muted" : "text-text-muted"
        }`}
      >
        Upload photos of lab results or PDFs
      </Text>
    </View>
  );
}
