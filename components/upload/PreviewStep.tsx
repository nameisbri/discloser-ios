import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  X,
  Plus,
  Image as ImageIcon,
  FileText,
} from "lucide-react-native";
import { Card } from "../Card";
import { Button } from "../Button";
import { hapticImpact } from "../../lib/utils/haptics";

export type SelectedFile = {
  uri: string;
  name: string;
  type: "image" | "pdf";
  size?: number;
  pageCount?: number;
};

interface PreviewStepProps {
  isDark: boolean;
  selectedFiles: SelectedFile[];
  maxFiles: number;
  onBack: () => void;
  onRemoveFile: (index: number) => void;
  onAddMore: () => void;
  onContinue: () => void;
}

export function PreviewStep({
  isDark,
  selectedFiles,
  maxFiles,
  onBack,
  onRemoveFile,
  onAddMore,
  onContinue,
}: PreviewStepProps) {
  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={onBack}
          className="p-2 -ml-2"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
        <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Documents Selected
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        <Text className={`font-inter-medium mb-4 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
          {selectedFiles.length} of {maxFiles} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
          selected
        </Text>

        <View className="gap-3 mb-6">
          {selectedFiles.map((file, index) => (
            <Card key={index} className="flex-row items-center p-4">
              <View className={`p-3 rounded-xl mr-4 ${isDark ? "bg-dark-surface-light" : "bg-gray-50"}`}>
                {file.type === "pdf" ? (
                  <FileText size={24} color={isDark ? "#FF2D7A" : "#923D5C"} />
                ) : (
                  <ImageIcon size={24} color={isDark ? "#FF2D7A" : "#923D5C"} />
                )}
              </View>
              <View className="flex-1">
                <Text
                  className={`font-inter-semibold mb-1 ${isDark ? "text-dark-text" : "text-text"}`}
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
                <Text className={`text-xs font-inter-regular uppercase ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                  {file.type === "pdf"
                    ? `PDF${file.pageCount ? ` \u2022 ${file.pageCount} page${file.pageCount !== 1 ? "s" : ""}` : ""}`
                    : "Image"}
                </Text>
              </View>
              <Pressable
                onPress={async () => {
                  await hapticImpact("medium");
                  onRemoveFile(index);
                }}
                className={`p-3 rounded-xl ${isDark ? "bg-dark-danger-bg" : "bg-danger-light"}`}
                style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
                accessibilityLabel={`Remove ${file.name}`}
                accessibilityRole="button"
                accessibilityHint="Removes this file from upload"
              >
                <X size={18} color="#DC3545" />
              </Pressable>
            </Card>
          ))}
        </View>

        {/* Add more files - only show if under limit */}
        {selectedFiles.length < maxFiles && (
          <Pressable
            onPress={onAddMore}
            className={`flex-row items-center justify-center py-4 border-2 border-dashed rounded-2xl mb-6 ${isDark ? "border-dark-border" : "border-border"}`}
            accessibilityLabel="Add more files"
            accessibilityRole="button"
          >
            <Plus size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
            <Text className={`font-inter-semibold ml-2 ${isDark ? "text-dark-accent" : "text-primary"}`}>
              Add More Files ({maxFiles - selectedFiles.length} remaining)
            </Text>
          </Pressable>
        )}

        <Button
          label="Continue to Details"
          onPress={onContinue}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
