import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import {
  X,
  Clock,
  Eye,
  User,
  Copy,
  Check,
  Trash2,
  QrCode,
  Calendar,
  ShieldCheck,
  ChevronDown,
  Smartphone,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSTIStatus, useThemeColors } from "../lib/hooks";
import { useTheme } from "../context/theme";
import { Button } from "./Button";
import { TabBar } from "./TabBar";
import { HeaderLogo } from "./HeaderLogo";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/utils/logger";
import { formatDate } from "../lib/utils/date";
import type { StatusShareLink, Database } from "../lib/types";

const EXPIRY_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
];

const VIEW_LIMIT_OPTIONS = [
  { label: "Unlimited", value: null },
  { label: "1 view", value: 1 },
  { label: "5 views", value: 5 },
  { label: "10 views", value: 10 },
];

type DisplayNameOption = "anonymous" | "alias" | "firstName";

interface StatusShareModalProps {
  visible: boolean;
  onClose: () => void;
}

export function StatusShareModal({ visible, onClose }: StatusShareModalProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const { aggregatedStatus, routineStatus, knownConditionsStatus, loading: statusLoading, refetch: refetchStatus } = useSTIStatus();
  const [view, setView] = useState<"preview" | "create" | "qr" | "links" | "recipient">("preview");
  const [links, setLinks] = useState<StatusShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_OPTIONS[1]);
  const [selectedViewLimit, setSelectedViewLimit] = useState(VIEW_LIMIT_OPTIONS[0]);
  const [displayNameOption, setDisplayNameOption] = useState<DisplayNameOption>("anonymous");
  const [excludeKnownConditions, setExcludeKnownConditions] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<StatusShareLink | null>(null);
  const [previewLink, setPreviewLink] = useState<StatusShareLink | null>(null);
  const [userProfile, setUserProfile] = useState<{ first_name: string | null; alias: string | null; display_name: string | null } | null>(null);

  // Theme colors from shared hook
  const colors = useThemeColors();

  const fetchUserProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("first_name, alias, display_name")
      .eq("id", user.id)
      .single();
    setUserProfile(data);
  }, []);

  const getDisplayName = useCallback((): string | null => {
    if (displayNameOption === "anonymous") return null;
    if (displayNameOption === "alias") return userProfile?.alias || null;
    if (displayNameOption === "firstName") return userProfile?.first_name || null;
    return null;
  }, [displayNameOption, userProfile]);

  // Memoize status computation to prevent redundant recalculations
  const statusToShare = useMemo(() => {
    if (excludeKnownConditions) {
      return routineStatus;
    }
    return aggregatedStatus;
  }, [excludeKnownConditions, routineStatus, aggregatedStatus]);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.debug("fetchLinks: No user found");
        setLoading(false);
        return;
      }

      logger.debug("fetchLinks: Fetching for user", { userId: user.id });
      const { data, error } = await supabase
        .from("status_share_links")
        .select("*")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("fetchLinks error", { error });
        setLoading(false);
        return;
      }

      logger.debug("fetchLinks: Found links", { count: data?.length || 0 });

      // Filter out links at max_views
      const activeLinks = (data || []).filter(
        (link: StatusShareLink) => link.max_views === null || link.view_count < link.max_views
      );

      setLinks(activeLinks);
    } catch (err) {
      logger.error("fetchLinks exception", { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setView("preview");
      refetchStatus(); // Refresh STI status data when modal opens
      fetchLinks();
      fetchUserProfile();
    }
  }, [visible, refetchStatus, fetchLinks, fetchUserProfile]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const expiresAt = new Date(Date.now() + selectedExpiry.hours * 60 * 60 * 1000).toISOString();
    const displayName = getDisplayName();

    // Store snapshot of current status - respect excludeKnownConditions toggle
    const statusSnapshot = statusToShare.map(s => ({
      name: s.name,
      status: s.status,
      result: s.result,
      testDate: s.testDate,
      isVerified: s.isVerified,
      isKnownCondition: s.isKnownCondition,
      hasTestData: s.hasTestData,
    }));

    const { data, error } = await supabase
      .from("status_share_links")
      .insert({
        user_id: user.id,
        expires_at: expiresAt,
        max_views: selectedViewLimit.value,
        show_name: displayNameOption !== "anonymous",
        display_name: displayName,
        status_snapshot: statusSnapshot,
      } as any)
      .select()
      .single();

    setCreating(false);

    if (error) {
      Alert.alert("Couldn't Create Link", "Something went wrong while creating your share link. Please check your connection and try again.");
      return;
    }

    await fetchLinks();
    setView("links");
  }, [selectedExpiry, selectedViewLimit, displayNameOption, statusToShare, getDisplayName, fetchLinks]);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from("status_share_links").delete().eq("id", id);
    setLinks(prevLinks => prevLinks.filter(l => l.id !== id));
  }, []);

  const getShareUrl = useCallback((token: string) => {
    const baseUrl = process.env.EXPO_PUBLIC_SHARE_BASE_URL || "https://discloser.app";
    return `${baseUrl}/status/${token}`;
  }, []);

  const handleCopy = useCallback(async (link: StatusShareLink) => {
    await Clipboard.setStringAsync(getShareUrl(link.token));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, [getShareUrl]);

  const formatExpiry = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const hours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h left`;
    const days = Math.round(hours / 24);
    return `${days}d left`;
  }, []);

  // Memoize color computation functions to prevent recreation on every render
  const getStatusColor = useCallback((status: string, isKnown?: boolean) => {
    if (isKnown) return colors.info;
    if (status === "negative") return colors.success;
    if (status === "positive") return colors.danger;
    return colors.warning;
  }, [colors.info, colors.success, colors.danger, colors.warning]);

  const getStatusBg = useCallback((status: string, isKnown?: boolean) => {
    if (isKnown) return colors.infoLight;
    if (status === "negative") return colors.successLight;
    if (status === "positive") return colors.dangerLight;
    return colors.warningLight;
  }, [colors.infoLight, colors.successLight, colors.dangerLight, colors.warningLight]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <HeaderLogo size={28} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginLeft: 8 }}>Share your status</Text>
          </View>
          <Pressable onPress={onClose} style={{ padding: 8, minWidth: 44, minHeight: 44 }} accessibilityLabel="Close" accessibilityRole="button" accessibilityHint="Closes the status share modal">
            <X size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {view === "preview" && (
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, textAlign: "center" }}>
              Preview what they'll see. No surprises.
            </Text>

            {/* Status Preview */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              {statusLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : statusToShare.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <ShieldCheck size={32} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 }}>Nothing to share yet</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 18 }}>
                    Need individual test breakdowns.{"\n"}
                    Upload a detailed lab report to get started.
                  </Text>
                </View>
              ) : (
                statusToShare.map((sti, index) => (
                  <View key={sti.name}>
                    {index > 0 && <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{sti.name}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                          <Calendar size={12} color={colors.textSecondary} />
                          <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>
                            {sti.hasTestData ? `Last tested: ${formatDate(sti.testDate)}` : `Declared: ${formatDate(sti.testDate)}`}
                          </Text>
                          {sti.isVerified && sti.hasTestData && (
                            <>
                              <ShieldCheck size={12} color={colors.success} style={{ marginLeft: 8 }} />
                              <Text style={{ fontSize: 12, color: colors.success, marginLeft: 2 }}>Verified</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <View style={{ backgroundColor: getStatusBg(sti.status, sti.isKnownCondition), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: getStatusColor(sti.status, sti.isKnownCondition) }}>
                          {sti.isKnownCondition ? "Known" : sti.result}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            <Button
              label="Create a link"
              onPress={() => setView("create")}
              disabled={statusToShare.length === 0}
            />

            {links.length > 0 && (
              <Pressable onPress={() => setView("links")} style={{ marginTop: 12, padding: 12, alignItems: "center" }} accessibilityLabel={"View Active Links, " + links.length + " links"} accessibilityRole="button" accessibilityHint="Shows your active share links">
                <Text style={{ color: colors.primary, fontWeight: "600" }}>View Active Links ({links.length})</Text>
              </Pressable>
            )}
          </ScrollView>
        )}

        {view === "create" && (
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Pressable onPress={() => setView("preview")} style={{ marginBottom: 16 }} accessibilityLabel="Back to Preview" accessibilityRole="button" accessibilityHint="Returns to the status preview">
              <Text style={{ color: colors.primary, fontWeight: "600" }}>← Back to Preview</Text>
            </Pressable>

            {/* Expiry Selection */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 12 }}>Self-destructs in</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {EXPIRY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.hours}
                    onPress={() => setSelectedExpiry(opt)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: selectedExpiry.hours === opt.hours ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: selectedExpiry.hours === opt.hours ? colors.primary : colors.border,
                    }}
                    accessibilityLabel={opt.label + (selectedExpiry.hours === opt.hours ? ", selected" : "")}
                    accessibilityRole="button"
                    accessibilityHint={"Sets link expiry to " + opt.label}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "500", color: selectedExpiry.hours === opt.hours ? "#fff" : colors.text }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* View Limit */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 12 }}>View limit</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {VIEW_LIMIT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => setSelectedViewLimit(opt)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: selectedViewLimit.value === opt.value ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: selectedViewLimit.value === opt.value ? colors.primary : colors.border,
                    }}
                    accessibilityLabel={opt.label + (selectedViewLimit.value === opt.value ? ", selected" : "")}
                    accessibilityRole="button"
                    accessibilityHint={"Sets view limit to " + opt.label}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "500", color: selectedViewLimit.value === opt.value ? "#fff" : colors.text }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Display Name Selection */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 12 }}>How to identify yourself</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Pressable
                  onPress={() => setDisplayNameOption("anonymous")}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: displayNameOption === "anonymous" ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: displayNameOption === "anonymous" ? colors.primary : colors.border,
                  }}
                  accessibilityLabel={"Anonymous" + (displayNameOption === "anonymous" ? ", selected" : "")}
                  accessibilityRole="button"
                  accessibilityHint="Share without showing your name"
                >
                  <Text style={{ fontSize: 14, fontWeight: "500", color: displayNameOption === "anonymous" ? "#fff" : colors.text }}>
                    Anonymous
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDisplayNameOption("alias")}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: displayNameOption === "alias" ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: displayNameOption === "alias" ? colors.primary : colors.border,
                  }}
                  accessibilityLabel={(userProfile?.alias || "Alias") + (displayNameOption === "alias" ? ", selected" : "")}
                  accessibilityRole="button"
                  accessibilityHint="Share with your alias visible"
                >
                  <Text style={{ fontSize: 14, fontWeight: "500", color: displayNameOption === "alias" ? "#fff" : colors.text }}>
                    {userProfile?.alias || "Alias"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDisplayNameOption("firstName")}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: displayNameOption === "firstName" ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: displayNameOption === "firstName" ? colors.primary : colors.border,
                  }}
                  accessibilityLabel={"First Name" + (displayNameOption === "firstName" ? ", selected" : "")}
                  accessibilityRole="button"
                  accessibilityHint="Share with your first name visible"
                >
                  <Text style={{ fontSize: 14, fontWeight: "500", color: displayNameOption === "firstName" ? "#fff" : colors.text }}>
                    First Name
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Exclude Known Conditions Toggle */}
            {knownConditionsStatus.length > 0 && (
              <Pressable
                onPress={() => setExcludeKnownConditions(!excludeKnownConditions)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 32,
                }}
                accessibilityLabel={"Hide chronic conditions" + (excludeKnownConditions ? ", enabled" : ", disabled")}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: excludeKnownConditions }}
                accessibilityHint="Toggles whether chronic conditions are included in the shared status"
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: excludeKnownConditions ? colors.primary : colors.border, backgroundColor: excludeKnownConditions ? colors.primary : colors.surface, alignItems: "center", justifyContent: "center" }}>
                    {excludeKnownConditions && <Check size={16} color="#fff" />}
                  </View>
                  <Text style={{ marginLeft: 12, color: colors.text, fontWeight: "500" }}>
                    Hide chronic conditions (HIV, Herpes, Hepatitis)
                  </Text>
                </View>
              </Pressable>
            )}

            <Button
              label={creating ? "Creating..." : "Create Link"}
              onPress={handleCreate}
              disabled={creating}
            />
          </ScrollView>
        )}

        {view === "links" && (
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Pressable onPress={() => setView("preview")} style={{ marginBottom: 16 }} accessibilityLabel="Back to Preview" accessibilityRole="button" accessibilityHint="Returns to the status preview">
              <Text style={{ color: colors.primary, fontWeight: "600" }}>← Back to Preview</Text>
            </Pressable>

            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Active Links</Text>

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : links.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: "center", padding: 20 }}>No links yet. Create one above.</Text>
            ) : (
              links.map((link) => (
                <View key={link.id} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                          <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textSecondary }}>{formatExpiry(link.expires_at)}</Text>
                        </View>
                        {link.show_name && (
                          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primaryLight }}>
                            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.primary }}>Name visible</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                        <Eye size={14} color={colors.textSecondary} />
                        <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>
                          {link.view_count} view{link.view_count !== 1 ? "s" : ""}
                          {link.max_views && ` / ${link.max_views} max`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => handleCopy(link)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: copiedId === link.id ? colors.successLight : colors.primaryLight,
                      }}
                      accessibilityLabel={copiedId === link.id ? "Copied to clipboard" : "Copy share link"}
                      accessibilityRole="button"
                      accessibilityHint="Copies the share link to your clipboard"
                    >
                      {copiedId === link.id ? (
                        <Check size={18} color={colors.success} />
                      ) : (
                        <Copy size={18} color={colors.primary} />
                      )}
                      <Text style={{ fontSize: 14, fontWeight: "500", color: copiedId === link.id ? colors.success : colors.primary, marginLeft: 8 }}>
                        {copiedId === link.id ? "Copied" : "Copy"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => { setPreviewLink(link); setView("recipient"); }}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceLight }}
                      accessibilityLabel="Preview"
                      accessibilityRole="button"
                      accessibilityHint="Shows how recipients will see this link"
                    >
                      <Smartphone size={18} color={colors.text} />
                    </Pressable>

                    <Pressable
                      onPress={() => { setQrLink(link); setView("qr"); }}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceLight }}
                      accessibilityLabel="Show QR Code"
                      accessibilityRole="button"
                      accessibilityHint="Displays a QR code for this share link"
                    >
                      <QrCode size={18} color={colors.text} />
                    </Pressable>

                    <Pressable
                      onPress={() => handleDelete(link.id)}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.dangerLight }}
                      accessibilityLabel="Delete share link"
                      accessibilityRole="button"
                      accessibilityHint="Permanently deletes this share link"
                    >
                      <Trash2 size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            <Button label="Create another" onPress={() => setView("create")} variant="secondary" />
          </ScrollView>
        )}

        {view === "qr" && qrLink && (
          <View style={{ flex: 1, padding: 16, alignItems: "center", justifyContent: "center" }}>
            <Pressable onPress={() => setView("links")} style={{ position: "absolute", top: 16, left: 16 }} accessibilityLabel="Back" accessibilityRole="button" accessibilityHint="Returns to the active links list">
              <Text style={{ color: colors.primary, fontWeight: "600" }}>← Back</Text>
            </Pressable>

            <View style={{ backgroundColor: colors.surface, padding: 24, borderRadius: 16, alignItems: "center" }}>
              <QRCode value={getShareUrl(qrLink.token)} size={200} color={colors.text} backgroundColor={colors.surface} />
              <Text style={{ marginTop: 16, color: colors.textSecondary, textAlign: "center" }}>
                Point, scan, done
              </Text>
            </View>

            <Pressable
              onPress={() => handleCopy(qrLink)}
              style={{ marginTop: 24, flexDirection: "row", alignItems: "center", padding: 12 }}
              accessibilityLabel="Copy Link"
              accessibilityRole="button"
              accessibilityHint="Copies the share link to your clipboard"
            >
              <Copy size={18} color={colors.primary} />
              <Text style={{ marginLeft: 8, color: colors.primary, fontWeight: "600" }}>Copy Link</Text>
            </Pressable>
          </View>
        )}

        {view === "recipient" && previewLink && (
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Pressable onPress={() => setView("links")} style={{ marginBottom: 16 }} accessibilityLabel="Back" accessibilityRole="button" accessibilityHint="Returns to the active links list">
              <Text style={{ color: colors.primary, fontWeight: "600" }}>← Back</Text>
            </Pressable>

            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, textAlign: "center" }}>
              Exactly what they'll see. No extras.
            </Text>

            {/* Recipient Preview Card */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 48, height: 48, backgroundColor: colors.primaryLight, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <ShieldCheck size={24} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                  STI Status
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Shared via Discloser
                </Text>
              </View>

              {/* Status Items - Respect the toggle choice */}
              {statusToShare.map((sti, index) => (
                <View key={index}>
                  {index > 0 && <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{sti.name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <Calendar size={12} color={colors.textSecondary} />
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>
                          {sti.hasTestData ? `Last tested: ${formatDate(sti.testDate)}` : `Declared: ${formatDate(sti.testDate)}`}
                        </Text>
                        {sti.isVerified && sti.hasTestData && (
                          <>
                            <ShieldCheck size={12} color={colors.success} style={{ marginLeft: 8 }} />
                            <Text style={{ fontSize: 12, color: colors.success, marginLeft: 2 }}>Verified</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={{ backgroundColor: getStatusBg(sti.status, sti.isKnownCondition), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: getStatusColor(sti.status, sti.isKnownCondition) }}>
                        {sti.isKnownCondition ? "Known" : sti.result}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Link Info */}
              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={{ marginLeft: 4, fontSize: 12, color: colors.textSecondary }}>
                      Expires: {formatExpiry(previewLink.expires_at)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Eye size={14} color={colors.textSecondary} />
                    <Text style={{ marginLeft: 4, fontSize: 12, color: colors.textSecondary }}>
                      {previewLink.view_count} views
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ marginTop: 20, gap: 12 }}>
              <Pressable
                onPress={() => handleCopy(previewLink)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, backgroundColor: colors.primary, borderRadius: 12 }}
                accessibilityLabel={copiedId === previewLink.id ? "Copied to clipboard" : "Copy share link"}
                accessibilityRole="button"
                accessibilityHint="Copies the share link to your clipboard"
              >
                {copiedId === previewLink.id ? <Check size={18} color="#fff" /> : <Copy size={18} color="#fff" />}
                <Text style={{ marginLeft: 8, color: "#fff", fontWeight: "600" }}>
                  {copiedId === previewLink.id ? "Copied!" : "Copy Link"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setQrLink(previewLink); setView("qr"); }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, backgroundColor: colors.primaryLight, borderRadius: 12 }}
                accessibilityLabel="Show QR Code"
                accessibilityRole="button"
                accessibilityHint="Displays a QR code for this share link"
              >
                <QrCode size={18} color={colors.primary} />
                <Text style={{ marginLeft: 8, color: colors.primary, fontWeight: "600" }}>Show QR Code</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        <TabBar
          activeTab="dashboard"
          onTabPress={(tab) => {
            onClose();
            router.push(`/${tab}`);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
