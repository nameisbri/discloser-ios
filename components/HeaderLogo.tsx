import { View, Text, Image } from "react-native";
import { useTheme } from "../context/theme";

const LOGO_LIGHT = require("../assets/logomark.png");
const LOGO_DARK = require("../assets/logomark-dark.png");

interface HeaderLogoProps {
  size?: number;
  showText?: boolean;
}

export function HeaderLogo({ size = 32, showText = false }: HeaderLogoProps) {
  const { isDark } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Image
        source={isDark ? LOGO_DARK : LOGO_LIGHT}
        style={{ width: size, height: size }}
        accessibilityLabel="Discloser logo"
      />
      {showText && (
        <Text
          style={{
            marginLeft: 8,
            fontSize: 17,
            fontWeight: "600",
            color: isDark ? "#FFFFFF" : "#374151",
            fontFamily: "Inter-SemiBold",
          }}
        >
          Discloser
        </Text>
      )}
    </View>
  );
}
