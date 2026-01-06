import * as AppleAuthentication from "expo-apple-authentication";
import { View, Text, Platform, Pressable } from "react-native";
import { useAuth } from "../../context/auth";
import { Heart, Sparkles, Shield } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Login() {
  const { signInWithApple, devBypass } = useAuth();

  return (
    <View className="flex-1">
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={["#923D5C", "#6B2D45", "#2D2438"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, paddingTop: 80, paddingBottom: 40, paddingHorizontal: 32 }}
      >
        {/* Decorative circles */}
        <View className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/5" />
        <View className="absolute top-32 left-5 w-20 h-20 rounded-full bg-white/5" />
        <View className="absolute bottom-40 right-5 w-16 h-16 rounded-full bg-accent/20" />

        <View className="flex-1 justify-center">
          {/* Logo mark */}
          <View className="w-16 h-16 bg-white/10 rounded-2xl items-center justify-center mb-8 border border-white/20">
            <Heart size={32} color="#FF6B8A" fill="#FF6B8A" />
          </View>

          <Text className="text-5xl font-inter-bold text-white mb-4">
            Discloser
          </Text>
          <Text className="text-xl font-inter-medium text-white/80 leading-8 mb-2">
            Your sexual health,{"\n"}
            <Text className="text-accent font-inter-bold">your control.</Text>
          </Text>
          <Text className="text-base font-inter-regular text-white/60 leading-6 mt-4">
            Store results securely. Share on your terms.{"\n"}
            No awkward conversations required.
          </Text>
        </View>

        {/* Feature pills */}
        <View className="flex-row flex-wrap gap-2 mb-8">
          <FeaturePill icon={<Shield size={14} color="#10B981" />} label="End-to-end encrypted" />
          <FeaturePill icon={<Sparkles size={14} color="#F59E0B" />} label="Auto-expiring links" />
        </View>
      </LinearGradient>

      {/* Bottom card with sign in */}
      <View className="bg-background-card px-8 py-10 rounded-t-[32px] -mt-8">
        <Text className="text-center text-text-light font-inter-medium mb-6">
          Ready to take control?
        </Text>

        {Platform.OS === "ios" ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={16}
            style={{ width: "100%", height: 56 }}
            onPress={signInWithApple}
          />
        ) : (
          <View className="bg-secondary-dark py-4 rounded-2xl">
            <Text className="text-white text-center font-inter-semibold">
              Apple Sign-In requires iOS
            </Text>
          </View>
        )}

        {__DEV__ && (
          <Pressable onPress={devBypass} className="mt-4 py-3">
            <Text className="text-primary text-center font-inter-medium">
              Skip Login (Dev)
            </Text>
          </Pressable>
        )}

        <Text className="text-center text-text-muted text-xs font-inter-regular mt-6">
          By signing in, you agree to keep your health data{"\n"}
          private and share responsibly ❤️
        </Text>
      </View>
    </View>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center bg-white/10 px-3 py-2 rounded-full border border-white/10">
      {icon}
      <Text className="text-white/90 text-xs font-inter-medium ml-2">{label}</Text>
    </View>
  );
}
