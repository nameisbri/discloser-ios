import * as AppleAuthentication from "expo-apple-authentication";
import { View, Text, Platform, Image, ScrollView, KeyboardAvoidingView } from "react-native";
import { useAuth } from "../../context/auth";
import { useTheme } from "../../context/theme";
import { Sparkles, Shield } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GoogleSignInButton } from "../../components/GoogleSignInButton";
import { MagicLinkForm } from "../../components/MagicLinkForm";

export default function Login() {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const { isDark } = useTheme();

  // Gradient colors based on theme
  const gradientColors: [string, string, string] = isDark
    ? ["#1A1520", "#2D2438", "#0D0B0E"]
    : ["#923D5C", "#6B2D45", "#2D2438"];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, paddingTop: 80, paddingBottom: 40, paddingHorizontal: 32 }}
      >
        {/* Decorative circles */}
        <View className={`absolute top-10 right-10 w-32 h-32 rounded-full ${isDark ? "bg-dark-accent/10" : "bg-white/5"}`} />
        <View className={`absolute top-32 left-5 w-20 h-20 rounded-full ${isDark ? "bg-dark-lavender/10" : "bg-white/5"}`} />
        <View className={`absolute bottom-40 right-5 w-16 h-16 rounded-full ${isDark ? "bg-dark-mint/20" : "bg-accent/20"}`} />

        <View className="flex-1 justify-center">
          {/* Logo mark */}
          <Image
            source={require("../../assets/icon.png")}
            style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 32 }}
          />

          <Text className="text-5xl font-inter-bold text-white mb-4">
            Discloser
          </Text>
          <Text className="text-xl font-inter-medium text-white/80 leading-8 mb-2">
            Share your status.{"\n"}
            <Text className={`font-inter-bold ${isDark ? "text-dark-accent" : "text-accent"}`}>Keep your name.</Text>
          </Text>
          <Text className="text-base font-inter-regular text-white/60 leading-6 mt-4">
            Being responsible shouldn't cost you your privacy.{"\n"}
            Be adventurous. Stay anonymous.
          </Text>
        </View>

        {/* Feature pills */}
        <View className="flex-row flex-wrap gap-2 mb-8">
          <FeaturePill icon={<Shield size={14} color={isDark ? "#00E5A0" : "#10B981"} />} label="Privacy that works" isDark={isDark} />
          <FeaturePill icon={<Sparkles size={14} color={isDark ? "#FF2D7A" : "#F59E0B"} />} label="Links that vanish" isDark={isDark} />
        </View>
      </LinearGradient>

      {/* Bottom card with sign in */}
      <View className={`px-8 py-10 rounded-t-[32px] -mt-8 ${isDark ? "bg-dark-surface" : "bg-background-card"}`}>
        <Text className={`text-center font-inter-medium mb-6 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
          Your results. Your rules.
        </Text>

        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={16}
            style={{ width: "100%", height: 56 }}
            onPress={signInWithApple}
          />
        )}

        {Platform.OS === "ios" && (
          <View className="flex-row items-center my-4">
            <View className={`flex-1 h-px ${isDark ? "bg-dark-border" : "bg-border"}`} />
            <Text className={`mx-4 text-sm ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>or</Text>
            <View className={`flex-1 h-px ${isDark ? "bg-dark-border" : "bg-border"}`} />
          </View>
        )}

        {Platform.OS === "android" && (
          <>
            <GoogleSignInButton onPress={signInWithGoogle} isDark={isDark} />
            <View className="flex-row items-center my-4">
              <View className={`flex-1 h-px ${isDark ? "bg-dark-border" : "bg-border"}`} />
              <Text className={`mx-4 text-sm ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>or</Text>
              <View className={`flex-1 h-px ${isDark ? "bg-dark-border" : "bg-border"}`} />
            </View>
          </>
        )}

        <MagicLinkForm />

        <Text className={`text-center text-xs font-inter-regular mt-6 ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}>
          Your data stays yours. Always encrypted.{"\n"}
          Be adventurous. Stay anonymous.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function FeaturePill({ icon, label, isDark }: { icon: React.ReactNode; label: string; isDark: boolean }) {
  return (
    <View className={`flex-row items-center px-3 py-2 rounded-full border ${isDark ? "bg-dark-surface-light/50 border-dark-border" : "bg-white/10 border-white/10"}`}>
      {icon}
      <Text className="text-white/90 text-xs font-inter-medium ml-2">{label}</Text>
    </View>
  );
}
