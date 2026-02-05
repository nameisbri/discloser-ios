import { View, Text, SafeAreaView, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  Upload as UploadIcon,
  Camera,
  Info,
  ChevronLeft,
  Image as ImageIcon,
  FileText,
} from "lucide-react-native";
import { UploadOption } from "./UploadOption";

interface SelectStepProps {
  isDark: boolean;
  onPickImage: (useCamera: boolean) => void;
  onPickPDF: () => void;
}

export function SelectStep({ isDark, onPickImage, onPickPDF }: SelectStepProps) {
  const router = useRouter();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <View className="flex-row items-center px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-8 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center mb-10">
          <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/30"}`}>
            <UploadIcon size={40} color={isDark ? "#FF2D7A" : "#923D5C"} />
          </View>
          <Text className={`text-3xl font-inter-bold mb-3 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
            Add a result
          </Text>
          <Text className={`font-inter-regular text-center ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
            We'll keep it safe. You decide who sees it.
          </Text>
        </View>

        <View className="gap-4">
          <UploadOption
            icon={<Camera size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />}
            title="Take a photo"
            description="Take a photo of your results"
            onPress={() => onPickImage(true)}
            isDark={isDark}
          />
          <UploadOption
            icon={<ImageIcon size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />}
            title="Choose from photos"
            description="Already have it saved? Perfect."
            onPress={() => onPickImage(false)}
            isDark={isDark}
          />
          <UploadOption
            icon={<FileText size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />}
            title="Upload a PDF"
            description="Got a PDF from your lab portal?"
            onPress={onPickPDF}
            isDark={isDark}
          />
        </View>

        <View className={`p-5 rounded-3xl flex-row items-start mt-6 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/20"}`}>
          <Info size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
          <Text className={`ml-3 flex-1 font-inter-medium text-sm leading-5 ${isDark ? "text-dark-accent" : "text-primary-dark"}`}>
            Encrypted, secure, and yours alone. Privacy that's not just theatre.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
