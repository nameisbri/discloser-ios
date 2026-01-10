import { useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import {
  Calendar,
  ShieldCheck,
  AlertCircle,
  User,
  Lock,
} from "lucide-react-native";
import { useSharedResult } from "../lib/hooks/useShareLinks";
import { useProfile } from "../lib/hooks/useProfile";
import { useTheme } from "../context/theme";
import type { STIResult } from "../lib/types";

interface SharedResultPreviewProps {
  token: string;
}

export function SharedResultPreview({ token }: SharedResultPreviewProps) {
  const { result, loading, error } = useSharedResult(token);
  const { isDark } = useTheme();
  const { hasKnownCondition } = useProfile();

  const colors = useMemo(() => ({
    primary: isDark ? "#FF2D7A" : "#923D5C",
    primaryLight: isDark ? "rgba(255, 45, 122, 0.2)" : "#EAC4CE",
    secondaryDark: isDark ? "#FFFFFF" : "#2D2438",
    success: isDark ? "#00E5A0" : "#10B981",
    successLight: isDark ? "rgba(0, 229, 160, 0.15)" : "#D1FAE5",
    danger: "#EF4444",
    dangerLight: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
    warning: "#F59E0B",
    warningLight: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
    info: isDark ? "#C9A0DC" : "#7C3AED",
    infoLight: isDark ? "rgba(201, 160, 220, 0.2)" : "#F3E8FF",
    background: isDark ? "#0D0B0E" : "#FAFAFA",
    cardBg: isDark ? "#1A1520" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#1F2937",
    textLight: isDark ? "rgba(255, 255, 255, 0.6)" : "#6B7280",
    border: isDark ? "#3D3548" : "#E5E7EB",
    gray50: isDark ? "#0D0B0E" : "#F9FAFB",
    gray100: isDark ? "#1A1520" : "#F3F4F6",
  }), [isDark]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48, backgroundColor: colors.gray50 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontSize: 15, color: colors.textLight, marginTop: 16 }}>Loading shared result...</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48, backgroundColor: colors.gray50 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.dangerLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <AlertCircle size={32} color={colors.danger} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.danger, marginBottom: 8 }}>Link Invalid or Expired</Text>
        <Text style={{ fontSize: 15, color: colors.textLight, textAlign: "center" }}>
          {error || "This share link is no longer valid."}
        </Text>
      </View>
    );
  }

  const getStatusColor = (status: string, isKnown?: boolean) => {
    if (isKnown) return colors.info;
    switch (status) {
      case "negative":
        return colors.success;
      case "positive":
        return colors.danger;
      default:
        return colors.warning;
    }
  };

  const getStatusBgColor = (status: string, isKnown?: boolean) => {
    if (isKnown) return colors.infoLight;
    switch (status) {
      case "negative":
        return colors.successLight;
      case "positive":
        return colors.dangerLight;
      default:
        return colors.warningLight;
    }
  };

  // Check if all positives in this result are known conditions
  const allPositivesAreKnown = result?.sti_results?.length > 0 &&
    result.sti_results
      .filter((sti: STIResult) => sti.status === "positive")
      .every((sti: STIResult) => hasKnownCondition(sti.name));

  // Determine effective status for badge (use "known" if all positives are known)
  const effectiveStatus = result.status === "positive" && allPositivesAreKnown ? "known" : result.status;
  const statusLabel = effectiveStatus === "known" ? "Known" : result.status.charAt(0).toUpperCase() + result.status.slice(1);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }}>
      {/* Header Banner */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 32, alignItems: "center" }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Lock size={24} color="white" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "white", marginBottom: 4 }}>Discloser</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>Secure STI Test Result</Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingVertical: 24, marginTop: -16 }}>
        {/* Main Result Card */}
        <View style={{ backgroundColor: colors.cardBg, borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          {/* User info if shown */}
          {result.show_name && result.display_name && (
            <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <User size={18} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{result.display_name}</Text>
            </View>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textLight, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Test Type</Text>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.secondaryDark }}>{result.test_type}</Text>
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: getStatusBgColor(effectiveStatus, effectiveStatus === "known") }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: getStatusColor(effectiveStatus, effectiveStatus === "known") }}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 32 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.textLight, letterSpacing: 0.5, marginBottom: 4 }}>TEST DATE</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Calendar size={14} color={colors.textLight} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginLeft: 4 }}>{formatDate(result.test_date)}</Text>
              </View>
            </View>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.textLight, letterSpacing: 0.5, marginBottom: 4 }}>VERIFIED</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ShieldCheck size={14} color={result.is_verified ? colors.success : colors.textLight} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: result.is_verified ? colors.success : colors.text, marginLeft: 4 }}>
                  {result.is_verified ? "Yes" : "No"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detailed Breakdown */}
        {result.sti_results && result.sti_results.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.secondaryDark, marginBottom: 16 }}>Detailed Breakdown</Text>

            <View style={{ backgroundColor: colors.cardBg, borderRadius: 20, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
              {result.sti_results.map((sti: STIResult, index: number) => {
                const isKnown = hasKnownCondition(sti.name);
                return (
                  <View key={index}>
                    {index > 0 && <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>{sti.name}</Text>
                        {isKnown && (
                          <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.infoLight }}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.info, textTransform: "uppercase" }}>Known</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: getStatusColor(sti.status, isKnown) }}>
                        {isKnown && sti.status === "positive" ? "Known" : sti.result}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Disclaimer */}
        <View style={{ backgroundColor: colors.gray100, padding: 16, borderRadius: 16 }}>
          <Text style={{ fontSize: 12, color: colors.textLight, textAlign: "center", lineHeight: 18 }}>
            This result was shared securely via Discloser. Results are for informational purposes only. Always consult a healthcare professional.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

