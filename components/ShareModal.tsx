import { useState, useEffect, useMemo } from "react";
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
  Link as LinkIcon,
  Clock,
  Eye,
  User,
  Copy,
  Check,
  Trash2,
  QrCode,
  Plus,
  Smartphone,
} from "lucide-react-native";
import { useShareLinks, getShareUrl } from "../lib/hooks/useShareLinks";
import { useTheme } from "../context/theme";
import { supabase } from "../lib/supabase";
import { Button } from "./Button";
import { SharedResultPreview } from "./SharedResultPreview";
import { hapticImpact, hapticNotification, hapticSelection } from "../lib/utils/haptics";

type DisplayNameOption = "anonymous" | "alias" | "firstName";
import type { ShareLink } from "../lib/types";

type ExpiryOption = {
  label: string;
  hours: number;
};

const EXPIRY_OPTIONS: ExpiryOption[] = [
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

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  testResultId: string;
}

export function ShareModal({ visible, onClose, testResultId }: ShareModalProps) {
  const { isDark } = useTheme();
  const { links, loading, error, fetchLinks, createShareLink, deleteShareLink } =
    useShareLinks(testResultId);

  const [view, setView] = useState<"list" | "create" | "qr" | "preview">("list");
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_OPTIONS[1]);
  const [selectedViewLimit, setSelectedViewLimit] = useState(VIEW_LIMIT_OPTIONS[0]);
  const [displayNameOption, setDisplayNameOption] = useState<DisplayNameOption>("anonymous");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<ShareLink | null>(null);
  const [userProfile, setUserProfile] = useState<{ first_name: string | null; alias: string | null } | null>(null);

  // Theme colors
  const colors = useMemo(() => ({
    bg: isDark ? "#0D0B0E" : "#FAFAFA",
    surface: isDark ? "#1A1520" : "#FFFFFF",
    surfaceLight: isDark ? "#2D2438" : "#F3F4F6",
    border: isDark ? "#3D3548" : "#E5E7EB",
    text: isDark ? "#FFFFFF" : "#1F2937",
    textSecondary: isDark ? "rgba(255, 255, 255, 0.7)" : "#6B7280",
    textMuted: isDark ? "rgba(255, 255, 255, 0.4)" : "#9CA3AF",
    primary: isDark ? "#FF2D7A" : "#923D5C",
    primaryLight: isDark ? "rgba(255, 45, 122, 0.2)" : "#EAC4CE80",
    success: "#10B981",
    successLight: isDark ? "rgba(16, 185, 129, 0.15)" : "#D1FAE5",
    danger: "#EF4444",
    dangerLight: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
  }), [isDark]);

  useEffect(() => {
    if (visible && testResultId) {
      fetchLinks();
      fetchUserProfile();
      setView("list");
    }
  }, [visible, testResultId, fetchLinks]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("first_name, alias")
      .eq("id", user.id)
      .single();
    setUserProfile(data);
  };

  const getDisplayName = (): string | null => {
    if (displayNameOption === "anonymous") return null;
    if (displayNameOption === "alias") return userProfile?.alias || null;
    if (displayNameOption === "firstName") return userProfile?.first_name || null;
    return null;
  };

  const handleCreate = async () => {
    setCreating(true);
    const expiresAt = new Date(
      Date.now() + selectedExpiry.hours * 60 * 60 * 1000
    ).toISOString();

    const link = await createShareLink({
      expires_at: expiresAt,
      max_views: selectedViewLimit.value,
      show_name: displayNameOption !== "anonymous",
      display_name: getDisplayName(),
    });

    setCreating(false);
    if (link) {
      setView("list");
      setSelectedExpiry(EXPIRY_OPTIONS[1]);
      setSelectedViewLimit(VIEW_LIMIT_OPTIONS[0]);
      setDisplayNameOption("anonymous");
    } else {
      Alert.alert("Couldn't Create Link", error || "Something went wrong while creating your share link. Please check your connection and try again.");
    }
  };

  const handleCopy = async (link: ShareLink) => {
    const url = getShareUrl(link.token);
    await Clipboard.setStringAsync(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (link: ShareLink) => {
    Alert.alert(
      "Delete Link",
      "This will permanently disable this share link.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteShareLink(link.id),
        },
      ]
    );
  };

  const handleShowQR = (link: ShareLink) => {
    setQrLink(link);
    setView("qr");
  };

  const formatExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  };

  const activeLinks = links.filter(
    (l) =>
      new Date(l.expires_at) > new Date() &&
      (l.max_views === null || l.view_count < l.max_views)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
          <Pressable
            onPress={async () => {
              await hapticImpact("light");
              if (view === "create" || view === "qr" || view === "preview")
                setView("list");
              else onClose();
            }}
            style={{ padding: 12, marginLeft: -12, minWidth: 44, minHeight: 44, justifyContent: "center" }}
            accessibilityLabel={view === "list" ? "Close" : "Back"}
            accessibilityRole="button"
          >
            {view === "list" ? (
              <X size={24} color={colors.text} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "500", color: colors.primary }}>Back</Text>
            )}
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
            {view === "create"
              ? "New Share Link"
              : view === "qr"
              ? "QR Code"
              : view === "preview"
              ? "Recipient View"
              : "Share Result"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* List View */}
        {view === "list" && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <LinkIcon size={32} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 22 }}>
                Share on your terms. Links that vanish when you want.
              </Text>
            </View>

            <Button
              label="Create a link"
              icon={<Plus size={20} color="white" />}
              onPress={() => setView("create")}
              className="mb-6"
            />

            {loading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: 32 }}
              />
            ) : activeLinks.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>No links yet</Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
                  Active Links ({activeLinks.length})
                </Text>
                <View style={{ gap: 12 }}>
                  {activeLinks.map((link) => (
                    <ShareLinkCard
                      key={link.id}
                      link={link}
                      onCopy={() => handleCopy(link)}
                      onDelete={() => handleDelete(link)}
                      onShowQR={() => handleShowQR(link)}
                      onPreview={() => {
                        setQrLink(link);
                        setView("preview");
                      }}
                      copied={copiedId === link.id}
                      formatExpiry={formatExpiry}
                      colors={colors}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        )}

        {/* Create View */}
        {view === "create" && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
            {/* Expiry */}
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
                      borderWidth: 1,
                      borderColor: selectedExpiry.hours === opt.hours ? colors.primary : colors.border,
                      backgroundColor: selectedExpiry.hours === opt.hours ? colors.primary : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: selectedExpiry.hours === opt.hours ? "white" : colors.text,
                      }}
                    >
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
                      borderWidth: 1,
                      borderColor: selectedViewLimit.value === opt.value ? colors.primary : colors.border,
                      backgroundColor: selectedViewLimit.value === opt.value ? colors.primary : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: selectedViewLimit.value === opt.value ? "white" : colors.text,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Display Name Selection */}
            <View style={{ marginBottom: 32 }}>
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
                >
                  <Text style={{ fontSize: 14, fontWeight: "500", color: displayNameOption === "firstName" ? "#fff" : colors.text }}>
                    First Name
                  </Text>
                </Pressable>
              </View>
            </View>

            <Button
              label={creating ? "Creating..." : "Create Link"}
              onPress={handleCreate}
              disabled={creating}
              icon={
                creating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : undefined
              }
            />
          </ScrollView>
        )}

        {/* QR View */}
        {view === "qr" && qrLink && (
          <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <QRCode
                value={getShareUrl(qrLink.token)}
                size={220}
                color={colors.text}
                backgroundColor={colors.surface}
              />
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.textSecondary, marginTop: 24, textAlign: "center" }}>Point, scan, done</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 4 }}>
                  {formatExpiry(qrLink.expires_at)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 24, width: "100%" }}>
              <Button
                label={copiedId === qrLink.id ? "Copied!" : "Copy Link"}
                variant="secondary"
                icon={
                  copiedId === qrLink.id ? (
                    <Check size={20} color={colors.primary} />
                  ) : (
                    <Copy size={20} color={colors.primary} />
                  )
                }
                onPress={() => handleCopy(qrLink)}
                className="flex-1"
              />
              <Button
                label="Preview"
                variant="outline"
                icon={<Smartphone size={20} color={colors.text} />}
                onPress={() => setView("preview")}
                className="flex-1"
              />
            </View>
          </View>
        )}

        {/* Preview View */}
        {view === "preview" && qrLink && (
          <SharedResultPreview token={qrLink.token} />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function ShareLinkCard({
  link,
  onCopy,
  onDelete,
  onShowQR,
  onPreview,
  copied,
  formatExpiry,
  colors,
}: {
  link: ShareLink;
  onCopy: () => void;
  onDelete: () => void;
  onShowQR: () => void;
  onPreview: () => void;
  copied: boolean;
  formatExpiry: (exp: string) => string;
  colors: Record<string, string>;
}) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
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
          onPress={onCopy}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: copied ? colors.successLight : colors.primaryLight,
          }}
        >
          {copied ? (
            <Check size={18} color={colors.success} />
          ) : (
            <Copy size={18} color={colors.primary} />
          )}
          <Text style={{ fontSize: 14, fontWeight: "500", color: copied ? colors.success : colors.primary, marginLeft: 8 }}>
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>

        <Pressable
          onPress={async () => { await hapticImpact("light"); onPreview(); }}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceLight, minWidth: 44, minHeight: 44 }}
          accessibilityLabel="Preview"
          accessibilityRole="button"
          accessibilityHint="Shows how recipients will see this link"
        >
          <Smartphone size={18} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={async () => { await hapticImpact("light"); onShowQR(); }}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceLight, minWidth: 44, minHeight: 44 }}
          accessibilityLabel="Show QR Code"
          accessibilityRole="button"
          accessibilityHint="Displays a QR code for this share link"
        >
          <QrCode size={18} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={async () => { await hapticNotification("warning"); onDelete(); }}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.dangerLight, minWidth: 44, minHeight: 44 }}
          accessibilityLabel="Delete share link"
          accessibilityRole="button"
          accessibilityHint="Permanently deletes this share link"
        >
          <Trash2 size={18} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}
