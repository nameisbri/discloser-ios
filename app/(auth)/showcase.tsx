import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Animated,
  Image,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  FileText,
  ShieldCheck,
  Share2,
  Lock,
  Timer,
  Bell,
  Shield,
} from "lucide-react-native";
import { useTheme } from "../../context/theme";
import { useEntranceAnimation, useReducedMotion } from "../../lib/utils/animations";
import { trackShowcaseViewed, trackShowcaseCtaTapped } from "../../lib/analytics";
import { useFocusEffect } from "expo-router";

const CAROUSEL_STEPS = [
  {
    icon: FileText,
    title: "Upload your results",
    description: "Snap a photo or upload a PDF of your lab results",
    color: "#FF2D7A",
    darkColor: "#FF2D7A",
  },
  {
    icon: ShieldCheck,
    title: "AI verifies them",
    description: "We extract and verify every line — no manual entry",
    color: "#10B981",
    darkColor: "#00E5A0",
  },
  {
    icon: Share2,
    title: "Share anonymously",
    description: "Send a secure, expiring link. Your name stays hidden",
    color: "#7C3AED",
    darkColor: "#C9A0DC",
  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Privacy first",
    description: "End-to-end encryption. Your data never leaves your device unprotected.",
    color: "#10B981",
    darkColor: "#00E5A0",
  },
  {
    icon: Timer,
    title: "Links that expire",
    description: "Set time limits and view caps. You decide when access ends.",
    color: "#F59E0B",
    darkColor: "#F59E0B",
  },
  {
    icon: Bell,
    title: "Smart reminders",
    description: "Personalized testing schedule based on CDC guidelines.",
    color: "#7C3AED",
    darkColor: "#C9A0DC",
  },
];

export default function Showcase() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const heroAnim = useEntranceAnimation(reduceMotion, 0);
  const carouselAnim = useEntranceAnimation(reduceMotion, 150);
  const featuresAnim = useEntranceAnimation(reduceMotion, 300);
  const trustAnim = useEntranceAnimation(reduceMotion, 400);

  useFocusEffect(
    useCallback(() => {
      trackShowcaseViewed();
    }, [])
  );

  const cardWidth = Math.min(width - 80, 420);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
        setActiveIndex(index);
      },
    }
  );

  const handleGetStarted = () => {
    trackShowcaseCtaTapped({ cta: "get_started" });
    router.push("/login");
  };

  const handleSignIn = () => {
    trackShowcaseCtaTapped({ cta: "sign_in" });
    router.push("/login");
  };

  const gradientColors: [string, string, string] = isDark
    ? ["#1A1520", "#2D2438", "#0D0B0E"]
    : ["#923D5C", "#6B2D45", "#2D2438"];

  return (
    <View className="flex-1">
      <FlatList
        data={[{ key: "content" }]}
        renderItem={() => (
          <View>
            {/* Hero */}
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingTop: 80, paddingBottom: 48, paddingHorizontal: 32, alignItems: "center" }}
            >
              {/* Decorative circles */}
              <View className={`absolute top-10 right-10 w-32 h-32 rounded-full ${isDark ? "bg-dark-accent/10" : "bg-white/5"}`} />
              <View className={`absolute top-32 left-5 w-20 h-20 rounded-full ${isDark ? "bg-dark-lavender/10" : "bg-white/5"}`} />
              <View className={`absolute bottom-20 right-5 w-16 h-16 rounded-full ${isDark ? "bg-dark-mint/20" : "bg-accent/20"}`} />

              <Animated.View style={{ opacity: heroAnim.opacity, transform: [{ translateY: heroAnim.translateY }], maxWidth: 500, width: "100%" }}>
                <Image
                  source={require("../../assets/logomark.png")}
                  style={{ width: 56, height: 56, marginBottom: 24 }}
                />
                <Text className="text-4xl font-inter-bold text-white mb-3">
                  Discloser
                </Text>
                <Text className="text-xl font-inter-medium text-white/80 leading-8">
                  Share your status.{"\n"}
                  <Text className={`font-inter-bold ${isDark ? "text-dark-accent" : "text-accent"}`}>
                    Keep your name.
                  </Text>
                </Text>
              </Animated.View>
            </LinearGradient>

            {/* How it works carousel */}
            <Animated.View
              style={{
                opacity: carouselAnim.opacity,
                transform: [{ translateY: carouselAnim.translateY }],
                paddingTop: 32,
              }}
            >
              <Text className={`text-lg font-inter-bold px-8 mb-4 ${isDark ? "text-dark-text" : "text-text"}`}>
                How it works
              </Text>
              <FlatList
                data={CAROUSEL_STEPS}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + 16}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 32 }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(_, i) => `step-${i}`}
                renderItem={({ item, index }) => {
                  const iconColor = isDark ? item.darkColor : item.color;
                  const Icon = item.icon;
                  return (
                    <View
                      style={{
                        width: cardWidth,
                        marginRight: index < CAROUSEL_STEPS.length - 1 ? 16 : 0,
                        padding: 24,
                        borderRadius: 20,
                        backgroundColor: isDark ? "#1E1826" : "#FFFFFF",
                        borderWidth: 1,
                        borderColor: isDark ? "#2D2438" : "#E5E7EB",
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          backgroundColor: iconColor + "20",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 16,
                        }}
                      >
                        <Icon size={24} color={iconColor} />
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: iconColor,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Step {index + 1}
                      </Text>
                      <Text className={`text-xl font-inter-bold mb-2 ${isDark ? "text-dark-text" : "text-text"}`}>
                        {item.title}
                      </Text>
                      <Text className={`text-sm leading-5 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                        {item.description}
                      </Text>
                    </View>
                  );
                }}
              />
              {/* Dot indicator */}
              <View className="flex-row justify-center mt-4 gap-2">
                {CAROUSEL_STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: activeIndex === i ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: activeIndex === i
                        ? (isDark ? "#FF2D7A" : "#923D5C")
                        : (isDark ? "#2D2438" : "#E5E7EB"),
                    }}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Feature highlights */}
            <Animated.View
              style={{
                opacity: featuresAnim.opacity,
                transform: [{ translateY: featuresAnim.translateY }],
                paddingHorizontal: 32,
                paddingTop: 32,
                maxWidth: 500,
                width: "100%",
                alignSelf: "center",
              }}
            >
              <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-text"}`}>
                Built for your privacy
              </Text>
              <View className="gap-3">
                {FEATURES.map((feature) => {
                  const iconColor = isDark ? feature.darkColor : feature.color;
                  const Icon = feature.icon;
                  return (
                    <View
                      key={feature.title}
                      className={`flex-row p-4 rounded-2xl ${isDark ? "bg-dark-surface" : "bg-white"}`}
                      style={{ borderWidth: 1, borderColor: isDark ? "#2D2438" : "#E5E7EB" }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: iconColor + "20",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 14,
                        }}
                      >
                        <Icon size={20} color={iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className={`font-inter-semibold mb-1 ${isDark ? "text-dark-text" : "text-text"}`}>
                          {feature.title}
                        </Text>
                        <Text className={`text-sm leading-5 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                          {feature.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Trust signal */}
            <Animated.View
              style={{
                opacity: trustAnim.opacity,
                transform: [{ translateY: trustAnim.translateY }],
                paddingHorizontal: 32,
                paddingTop: 24,
                paddingBottom: 140,
                maxWidth: 500,
                width: "100%",
                alignSelf: "center",
              }}
            >
              <View className={`flex-row items-center justify-center p-4 rounded-2xl ${isDark ? "bg-dark-surface" : "bg-gray-50"}`}>
                <Shield size={20} color={isDark ? "#00E5A0" : "#10B981"} />
                <Text className={`font-inter-medium text-sm ml-3 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                  Your data never leaves your device unprotected
                </Text>
              </View>
            </Animated.View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky CTA */}
      <SafeAreaView
        edges={["bottom"]}
        className={`absolute bottom-0 left-0 right-0 ${isDark ? "bg-dark-bg" : "bg-background"}`}
        style={{ borderTopWidth: 1, borderTopColor: isDark ? "#2D2438" : "#E5E7EB" }}
      >
        <View className="px-8 pt-4 pb-2" style={{ maxWidth: 500, width: "100%", alignSelf: "center" }}>
          <Pressable
            onPress={handleGetStarted}
            className={`py-4 rounded-2xl items-center ${isDark ? "bg-dark-accent active:bg-dark-accent/80" : "bg-primary active:bg-primary-dark"}`}
            accessibilityRole="button"
            accessibilityLabel="Get Started, takes about 2 minutes"
          >
            <Text className="text-white font-inter-bold text-base">
              Get Started — takes ~2 min
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSignIn}
            className="py-3 items-center"
            accessibilityRole="button"
            accessibilityLabel="I already have an account"
          >
            <Text className={`font-inter-medium text-sm ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
              I already have an account
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
