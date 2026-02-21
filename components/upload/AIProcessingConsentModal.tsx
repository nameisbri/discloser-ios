import { View, Text, Pressable, Modal, Linking } from "react-native";
import { Shield, ExternalLink } from "lucide-react-native";

interface AIProcessingConsentModalProps {
  visible: boolean;
  isDark: boolean;
  onConsent: () => void;
  onCancel: () => void;
}

export function AIProcessingConsentModal({
  visible,
  isDark,
  onConsent,
  onCancel,
}: AIProcessingConsentModalProps) {
  const handlePrivacyPolicy = () => {
    Linking.openURL("https://discloser.app/privacy");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end items-center">
        <View
          className={`rounded-t-3xl p-6 ${isDark ? "bg-dark-surface" : "bg-white"}`}
          style={{ maxWidth: 500, width: "100%" }}
        >
          {/* Shield icon */}
          <View className="items-center mb-4">
            <View
              className={`w-14 h-14 rounded-full items-center justify-center ${
                isDark ? "bg-dark-accent-muted" : "bg-primary-light/30"
              }`}
            >
              <Shield size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />
            </View>
          </View>

          {/* Title */}
          <Text
            className={`text-xl text-center font-inter-bold mb-4 ${
              isDark ? "text-dark-text" : "text-secondary-dark"
            }`}
          >
            How we process your documents
          </Text>

          {/* Body text */}
          <Text
            className={`text-sm font-inter-regular mb-3 ${
              isDark ? "text-dark-text-secondary" : "text-text-light"
            }`}
          >
            To read your lab results, your document is securely sent to
            third-party AI services that extract and interpret the text.
          </Text>
          <Text
            className={`text-sm font-inter-regular mb-4 ${
              isDark ? "text-dark-text-secondary" : "text-text-light"
            }`}
          >
            Your data is processed in real time and is not stored by these
            services.
          </Text>

          {/* Privacy policy link */}
          <Pressable
            onPress={handlePrivacyPolicy}
            className="flex-row items-center justify-center mb-6"
            accessibilityRole="link"
            accessibilityLabel="View Privacy Policy"
          >
            <Text
              className={`text-sm font-inter-medium mr-1 ${
                isDark ? "text-dark-accent" : "text-primary-dark"
              }`}
            >
              View Privacy Policy
            </Text>
            <ExternalLink
              size={14}
              color={isDark ? "#FF2D7A" : "#923D5C"}
            />
          </Pressable>

          {/* Continue button */}
          <Pressable
            onPress={onConsent}
            className={`py-4 rounded-2xl items-center mb-3 ${
              isDark ? "bg-dark-accent" : "bg-primary"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text className="text-white text-base font-inter-bold">
              Continue
            </Text>
          </Pressable>

          {/* Cancel link */}
          <Pressable
            onPress={onCancel}
            className="items-center py-2 mb-2"
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text
              className={`text-sm font-inter-medium ${
                isDark ? "text-dark-text-muted" : "text-text-light"
              }`}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
