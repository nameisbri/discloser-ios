import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  Calendar,
  ShieldCheck,
  AlertCircle,
  User,
  Lock,
} from "lucide-react-native";
import { useSharedResult } from "../lib/hooks/useShareLinks";
import type { STIResult } from "../lib/types";

// Colors from tailwind config
const colors = {
  primary: "#923D5C",
  primaryLight: "#EAC4CE",
  secondaryDark: "#2D2438",
  success: "#10B981",
  successLight: "#D1FAE5",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  background: "#FAFAFA",
  cardBg: "#FFFFFF",
  text: "#1F2937",
  textLight: "#6B7280",
  border: "#E5E7EB",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
};

interface SharedResultPreviewProps {
  token: string;
}

export function SharedResultPreview({ token }: SharedResultPreviewProps) {
  const { result, loading, error } = useSharedResult(token);

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading shared result...</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorIcon}>
          <AlertCircle size={32} color={colors.danger} />
        </View>
        <Text style={styles.errorTitle}>Link Invalid or Expired</Text>
        <Text style={styles.errorText}>
          {error || "This share link is no longer valid."}
        </Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "negative":
        return colors.success;
      case "positive":
        return colors.danger;
      default:
        return colors.warning;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "negative":
        return colors.successLight;
      case "positive":
        return colors.dangerLight;
      default:
        return colors.warningLight;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerIconCircle}>
          <Lock size={24} color="white" />
        </View>
        <Text style={styles.headerTitle}>Discloser</Text>
        <Text style={styles.headerSubtitle}>Secure STI Test Result</Text>
      </View>

      <View style={styles.content}>
        {/* Main Result Card */}
        <View style={styles.card}>
          {/* User info if shown */}
          {result.show_name && result.display_name && (
            <View style={styles.userRow}>
              <View style={styles.userIcon}>
                <User size={18} color={colors.primary} />
              </View>
              <Text style={styles.userName}>{result.display_name}</Text>
            </View>
          )}

          <View style={styles.resultHeader}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.labelSmall}>Test Type</Text>
              <Text style={styles.testType}>{result.test_type}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBgColor(result.status) },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(result.status) },
                ]}
              >
                {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>TEST DATE</Text>
              <View style={styles.metaValue}>
                <Calendar size={14} color={colors.textLight} />
                <Text style={styles.metaValueText}>
                  {formatDate(result.test_date)}
                </Text>
              </View>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>VERIFIED</Text>
              <View style={styles.metaValue}>
                <ShieldCheck
                  size={14}
                  color={result.is_verified ? colors.success : colors.textLight}
                />
                <Text
                  style={[
                    styles.metaValueText,
                    result.is_verified && { color: colors.success },
                  ]}
                >
                  {result.is_verified ? "Yes" : "No"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detailed Breakdown */}
        {result.sti_results && result.sti_results.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Detailed Breakdown</Text>

            <View style={styles.breakdownCard}>
              {result.sti_results.map((sti: STIResult, index: number) => (
                <View key={index}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.stiRow}>
                    <Text style={styles.stiName}>{sti.name}</Text>
                    <Text
                      style={[
                        styles.stiResult,
                        { color: getStatusColor(sti.status) },
                      ]}
                    >
                      {sti.result}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This result was shared securely via Discloser. Results are for
            informational purposes only. Always consult a healthcare
            professional.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textLight,
    marginTop: 16,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.danger,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: "center",
  },
  headerBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginTop: -16,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textLight,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  testType: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.secondaryDark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: 32,
  },
  metaItem: {},
  metaLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textLight,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.secondaryDark,
    marginBottom: 16,
  },
  breakdownCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  stiName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  stiResult: {
    fontSize: 14,
    fontWeight: "600",
  },
  disclaimer: {
    backgroundColor: colors.gray100,
    padding: 16,
    borderRadius: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 18,
  },
});
