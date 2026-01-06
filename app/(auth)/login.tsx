import * as AppleAuthentication from "expo-apple-authentication";
import { View, Text, Platform, Pressable, SafeAreaView } from "react-native";
import { useAuth } from "../../context/auth";
import { ShieldCheck, Lock, Share2 } from "lucide-react-native";
import { Button } from "../../components/Button";

export default function Login() {
  const { signInWithApple, devBypass } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-8 justify-between py-12">
        <View className="items-center mt-10">
          <View className="w-20 h-20 bg-primary-light rounded-3xl items-center justify-center mb-6 shadow-sm">
            <ShieldCheck size={40} color="#923D5C" />
          </View>
          <Text className="text-4xl font-inter-bold text-secondary-dark mb-3">
            Discloser
          </Text>
          <Text className="text-lg font-inter-medium text-text-light text-center px-4 leading-6">
            Taking the awkwardness out of sexual health management.
          </Text>
        </View>

        <View className="gap-8">
          <FeatureItem
            icon={<Lock size={24} color="#923D5C" />}
            title="Privacy First"
            description="Your medical data stays secure and private, always."
          />
          <FeatureItem
            icon={<Share2 size={24} color="#923D5C" />}
            title="Secure Sharing"
            description="Control exactly what you share and for how long."
          />
        </View>

        <View className="items-center pb-8">
          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={16}
              style={{ width: "100%", height: 56 }}
              onPress={signInWithApple}
            />
          ) : (
            <Button
              label="Apple Sign-In requires iOS"
              variant="secondary"
              className="w-full"
            />
          )}

          {__DEV__ && (
            <Button
              label="Skip Login (Dev Only)"
              variant="ghost"
              onPress={devBypass}
              className="mt-6"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start gap-4 mb-6">
      <View className="bg-primary-light/30 p-3 rounded-xl">{icon}</View>
      <View className="flex-1">
        <Text className="text-lg font-inter-semibold text-text mb-1">
          {title}
        </Text>
        <Text className="text-text-light font-inter-regular leading-5">
          {description}
        </Text>
      </View>
    </View>
  );
}
