import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/theme";
import {
  ExternalLink,
  Phone,
  MapPin,
  BookOpen,
  HeartHandshake,
  Globe,
  ChevronLeft,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_REGIONS,
  getResourcesByCategoryAndRegion,
} from "../../../lib/data/resources";
import { trackResourceTap } from "../../../lib/utils/analytics";
import { hapticImpact } from "../../../lib/utils/haptics";
import type { Resource, ResourceCategory } from "../../../lib/types";
import { HeaderLogo } from "../../../components/HeaderLogo";

const CATEGORY_ICONS: Record<ResourceCategory, typeof MapPin> = {
  "find-testing": MapPin,
  "learn-more": BookOpen,
  "get-support": HeartHandshake,
};

const CATEGORY_COLORS = {
  dark: {
    "find-testing": { icon: "#00E5A0", bg: "rgba(0, 229, 160, 0.15)" },
    "learn-more": { icon: "#C9A0DC", bg: "rgba(201, 160, 220, 0.15)" },
    "get-support": { icon: "#FF6B8A", bg: "rgba(255, 107, 138, 0.15)" },
  },
  light: {
    "find-testing": { icon: "#10B981", bg: "#ECFDF5" },
    "learn-more": { icon: "#7C3AED", bg: "#F3E8FF" },
    "get-support": { icon: "#EF4444", bg: "#FEF2F2" },
  },
};

const REGION_ICONS: Record<string, typeof Globe> = {
  national: Globe,
  ON: MapPin,
};

export default function Resources() {
  const router = useRouter();
  const { isDark } = useTheme();

  const handleResourcePress = async (resource: Resource) => {
    await hapticImpact("light");
    trackResourceTap(resource.id, resource.category, resource.region);

    if (resource.phone) {
      const telUrl = `tel:${resource.phone.replace(/[^+\d]/g, "")}`;
      Linking.openURL(telUrl);
    } else if (resource.url) {
      Linking.openURL(resource.url);
    }
  };

  const theme = isDark ? "dark" : "light";

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2" accessibilityLabel="Go back">
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
        <Text
          className={`flex-1 text-center text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}
        >
          Resources
        </Text>
        <HeaderLogo />
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Intro */}
        <Text
          className={`font-inter-regular text-sm leading-5 mb-6 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}
        >
          Curated sexual health resources across Canada. Find testing, learn
          more, or get support.
        </Text>

        {/* Regions → Categories → Resources */}
        {RESOURCE_REGIONS.map((region) => {
          const RegionIcon = REGION_ICONS[region.key] ?? Globe;

          // Only render categories that have resources for this region
          const categoriesWithItems = RESOURCE_CATEGORIES.filter(
            (cat) => getResourcesByCategoryAndRegion(cat.key, region.key).length > 0,
          );

          if (categoriesWithItems.length === 0) return null;

          return (
            <View key={region.key} className="mb-4">
              {/* Region Header */}
              <View className="flex-row items-center mb-5">
                <RegionIcon
                  size={16}
                  color={isDark ? "#FF2D7A" : "#923D5C"}
                />
                <Text
                  className={`text-sm font-inter-bold uppercase tracking-wider ml-2 ${isDark ? "text-dark-accent" : "text-primary"}`}
                >
                  {region.label}
                </Text>
              </View>

              {/* Categories within region */}
              {categoriesWithItems.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.key];
                const colors = CATEGORY_COLORS[theme][cat.key];
                const items = getResourcesByCategoryAndRegion(cat.key, region.key);

                return (
                  <View key={cat.key} className="mb-6">
                    {/* Category Header */}
                    <View className="flex-row items-center mb-3">
                      <View
                        className="w-7 h-7 rounded-lg items-center justify-center mr-2.5"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <Icon size={15} color={colors.icon} />
                      </View>
                      <Text
                        className={`text-base font-inter-semibold ${isDark ? "text-dark-text" : "text-text"}`}
                      >
                        {cat.label}
                      </Text>
                    </View>

                    {/* Resource Cards */}
                    <View
                      className={`rounded-2xl border overflow-hidden ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
                    >
                      {items.map((resource, index) => (
                        <Pressable
                          key={resource.id}
                          onPress={() => handleResourcePress(resource)}
                          className={`flex-row items-center p-4 ${isDark ? "active:bg-dark-surface-light" : "active:bg-gray-50"} ${
                            index > 0
                              ? isDark
                                ? "border-t border-dark-border"
                                : "border-t border-border"
                              : ""
                          }`}
                          accessibilityLabel={resource.title}
                          accessibilityRole="link"
                          accessibilityHint={
                            resource.phone
                              ? `Calls ${resource.phone}`
                              : `Opens ${resource.title} in your browser`
                          }
                        >
                          <View className="flex-1 mr-3">
                            <Text
                              className={`font-inter-semibold ${isDark ? "text-dark-text" : "text-text"}`}
                            >
                              {resource.title}
                            </Text>
                            <Text
                              className={`font-inter-regular text-sm mt-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}
                            >
                              {resource.description}
                            </Text>
                          </View>

                          {resource.phone ? (
                            <View
                              className="w-8 h-8 rounded-lg items-center justify-center"
                              style={{ backgroundColor: colors.bg }}
                            >
                              <Phone size={16} color={colors.icon} />
                            </View>
                          ) : (
                            <View
                              className="w-8 h-8 rounded-lg items-center justify-center"
                              style={{ backgroundColor: colors.bg }}
                            >
                              <ExternalLink size={16} color={colors.icon} />
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Disclaimer */}
        <Text
          className={`font-inter-regular text-xs text-center leading-4 mb-12 ${isDark ? "text-dark-text-muted" : "text-text-muted"}`}
        >
          These are external resources. Discloser is not affiliated with these
          organizations.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
