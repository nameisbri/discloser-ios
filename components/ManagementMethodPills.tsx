import { View, Text } from "react-native";
import { getMethodLabel } from "../lib/managementMethods";

interface ManagementMethodPillsProps {
  methods: string[];
  isDark: boolean;
}

/**
 * Renders a row of small lavender pills showing management methods.
 * Used on shared result cards and status previews.
 */
export function ManagementMethodPills({ methods, isDark }: ManagementMethodPillsProps) {
  if (!methods || methods.length === 0) return null;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
      {methods.map((methodId) => (
        <View
          key={methodId}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(201, 160, 220, 0.1)" : "#F3E8FF",
          }}
          accessibilityLabel={getMethodLabel(methodId)}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "500",
              color: isDark ? "#C9A0DC" : "#7C3AED",
            }}
          >
            {getMethodLabel(methodId)}
          </Text>
        </View>
      ))}
    </View>
  );
}
