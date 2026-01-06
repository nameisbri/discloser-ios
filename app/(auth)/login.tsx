import * as AppleAuthentication from "expo-apple-authentication";
import { View, Text, Platform, Pressable } from "react-native";
import { useAuth } from "../../context/auth";

export default function Login() {
  const { signInWithApple, devBypass } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold mb-2">Discloser</Text>
      <Text className="text-gray-500 mb-12 text-center">
        Securely manage and share your sexual health status
      </Text>

      {Platform.OS === "ios" && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={{ width: 280, height: 50 }}
          onPress={signInWithApple}
        />
      )}

      {Platform.OS !== "ios" && (
        <Text className="text-gray-400">Apple Sign-In requires iOS</Text>
      )}

      {__DEV__ && (
        <Pressable onPress={devBypass} className="mt-8 py-3 px-6 border border-gray-300 rounded-lg">
          <Text className="text-gray-500">Skip Login (Dev Only)</Text>
        </Pressable>
      )}
    </View>
  );
}
