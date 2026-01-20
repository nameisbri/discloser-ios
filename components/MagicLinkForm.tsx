import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../context/auth";
import { useTheme } from "../context/theme";
import { Mail, ArrowRight, CheckCircle } from "lucide-react-native";

interface MagicLinkFormProps {
  onSuccess?: () => void;
}

export function MagicLinkForm({ onSuccess }: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signInWithMagicLink } = useAuth();
  const { isDark } = useTheme();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const result = await signInWithMagicLink(email.trim().toLowerCase());
    setLoading(false);

    if (result.success) {
      setSent(true);
      onSuccess?.();
    } else {
      Alert.alert("Error", result.error || "Failed to send magic link. Please try again.");
    }
  };

  if (sent) {
    return (
      <View className={`p-6 rounded-2xl ${isDark ? "bg-dark-surface-light" : "bg-secondary/10"}`}>
        <View className="items-center mb-4">
          <View className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? "bg-dark-mint/20" : "bg-green-100"}`}>
            <CheckCircle size={24} color={isDark ? "#00E5A0" : "#10B981"} />
          </View>
        </View>
        <Text className={`text-center font-inter-semibold text-base mb-2 ${isDark ? "text-dark-text" : "text-primary"}`}>
          Check your email
        </Text>
        <Text className={`text-center font-inter-regular text-sm mb-4 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
          We sent a magic link to{"\n"}
          <Text className="font-inter-semibold">{email}</Text>
        </Text>
        <Pressable onPress={() => setSent(false)}>
          <Text className={`text-center font-inter-medium text-sm ${isDark ? "text-dark-accent" : "text-primary"}`}>
            Use a different email
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View className={`flex-row items-center rounded-2xl px-4 ${isDark ? "bg-dark-surface-light" : "bg-white border border-gray-200"}`}>
        <Mail size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
        <TextInput
          className={`flex-1 h-14 ml-3 font-inter-regular text-base ${isDark ? "text-dark-text" : "text-text"}`}
          placeholder="Enter your email"
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!loading}
        />
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={loading || !email.trim()}
        className={`flex-row items-center justify-center h-14 rounded-2xl mt-3 ${
          loading || !email.trim()
            ? isDark ? "bg-dark-surface-light" : "bg-gray-200"
            : isDark ? "bg-dark-accent" : "bg-primary"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text className={`font-inter-semibold text-base ${
              loading || !email.trim()
                ? isDark ? "text-dark-text-muted" : "text-gray-400"
                : "text-white"
            }`}>
              Continue with Email
            </Text>
            <ArrowRight
              size={18}
              color={loading || !email.trim() ? (isDark ? "#6B7280" : "#9CA3AF") : "white"}
              style={{ marginLeft: 8 }}
            />
          </>
        )}
      </Pressable>
    </View>
  );
}
