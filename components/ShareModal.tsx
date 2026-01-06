import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
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
import { Button } from "./Button";
import { SharedResultPreview } from "./SharedResultPreview";
import type { ShareLink } from "../lib/types";

// Colors from tailwind config
const colors = {
  primary: "#923D5C",
  primaryLight: "#EAC4CE",
  primaryDark: "#6B2D45",
  secondaryDark: "#2D2438",
  success: "#10B981",
  successLight: "#D1FAE5",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  background: "#FAFAFA",
  cardBg: "#FFFFFF",
  text: "#1F2937",
  textLight: "#6B7280",
  border: "#E5E7EB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
};

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
  const { links, loading, fetchLinks, createShareLink, deleteShareLink } =
    useShareLinks(testResultId);

  const [view, setView] = useState<"list" | "create" | "qr" | "preview">("list");
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_OPTIONS[1]);
  const [selectedViewLimit, setSelectedViewLimit] = useState(VIEW_LIMIT_OPTIONS[0]);
  const [showName, setShowName] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<ShareLink | null>(null);

  useEffect(() => {
    if (visible && testResultId) {
      fetchLinks();
      setView("list");
    }
  }, [visible, testResultId, fetchLinks]);

  const handleCreate = async () => {
    setCreating(true);
    const expiresAt = new Date(
      Date.now() + selectedExpiry.hours * 60 * 60 * 1000
    ).toISOString();

    const link = await createShareLink({
      expires_at: expiresAt,
      max_views: selectedViewLimit.value,
      show_name: showName,
    });

    setCreating(false);
    if (link) {
      setView("list");
      setSelectedExpiry(EXPIRY_OPTIONS[1]);
      setSelectedViewLimit(VIEW_LIMIT_OPTIONS[0]);
      setShowName(false);
    } else {
      Alert.alert("Error", "Failed to create share link");
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
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (view === "create" || view === "qr" || view === "preview")
                setView("list");
              else onClose();
            }}
            style={styles.headerButton}
          >
            {view === "list" ? (
              <X size={24} color={colors.text} />
            ) : (
              <Text style={styles.backText}>Back</Text>
            )}
          </Pressable>
          <Text style={styles.headerTitle}>
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
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
            <View style={styles.heroSection}>
              <View style={styles.iconCircle}>
                <LinkIcon size={32} color={colors.primary} />
              </View>
              <Text style={styles.heroText}>
                Create secure, time-limited links to share your test result.
              </Text>
            </View>

            <Button
              label="Create New Link"
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
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No active share links</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
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
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        )}

        {/* Create View */}
        {view === "create" && (
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
            {/* Expiry */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Link Expires After</Text>
              <View style={styles.optionsRow}>
                {EXPIRY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.hours}
                    onPress={() => setSelectedExpiry(opt)}
                    style={[
                      styles.optionChip,
                      selectedExpiry.hours === opt.hours && styles.optionChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selectedExpiry.hours === opt.hours && styles.optionChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* View Limit */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Maximum Views</Text>
              <View style={styles.optionsRow}>
                {VIEW_LIMIT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => setSelectedViewLimit(opt)}
                    style={[
                      styles.optionChip,
                      selectedViewLimit.value === opt.value && styles.optionChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selectedViewLimit.value === opt.value && styles.optionChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Show Name Toggle */}
            <Pressable
              onPress={() => setShowName(!showName)}
              style={styles.toggleRow}
            >
              <View style={styles.toggleContent}>
                <View style={styles.toggleIcon}>
                  <User size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Show Your Name</Text>
                  <Text style={styles.toggleSubtitle}>
                    Display your name on shared result
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggle,
                  showName ? styles.toggleOn : styles.toggleOff,
                ]}
              >
                <View style={styles.toggleKnob} />
              </View>
            </Pressable>

            <Button
              label={creating ? "Creating..." : "Create Share Link"}
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
          <View style={styles.qrContainer}>
            <View style={styles.qrCard}>
              <QRCode
                value={getShareUrl(qrLink.token)}
                size={220}
                color={colors.text}
                backgroundColor="white"
              />
              <Text style={styles.qrLabel}>Scan to view shared result</Text>
              <View style={styles.qrExpiry}>
                <Clock size={14} color={colors.textLight} />
                <Text style={styles.qrExpiryText}>
                  {formatExpiry(qrLink.expires_at)}
                </Text>
              </View>
            </View>

            <View style={styles.qrButtons}>
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
                textClassName="text-primary"
              />
              <Button
                label="Preview"
                variant="outline"
                icon={<Smartphone size={20} color={colors.primary} />}
                onPress={() => setView("preview")}
                className="flex-1"
                textClassName="text-primary"
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
}: {
  link: ShareLink;
  onCopy: () => void;
  onDelete: () => void;
  onShowQR: () => void;
  onPreview: () => void;
  copied: boolean;
  formatExpiry: (exp: string) => string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeOutline}>
              <Text style={styles.badgeOutlineText}>{formatExpiry(link.expires_at)}</Text>
            </View>
            {link.show_name && (
              <View style={styles.badgeSecondary}>
                <Text style={styles.badgeSecondaryText}>Name visible</Text>
              </View>
            )}
          </View>
          <View style={styles.viewCount}>
            <Eye size={14} color={colors.textLight} />
            <Text style={styles.viewCountText}>
              {link.view_count} view{link.view_count !== 1 ? "s" : ""}
              {link.max_views && ` / ${link.max_views} max`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          onPress={onCopy}
          style={[styles.actionButton, styles.actionButtonPrimary, copied && styles.actionButtonSuccess]}
        >
          {copied ? (
            <Check size={18} color={colors.success} />
          ) : (
            <Copy size={18} color={colors.primary} />
          )}
          <Text style={[styles.actionButtonText, copied && styles.actionButtonTextSuccess]}>
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>

        <Pressable onPress={onPreview} style={styles.iconButton}>
          <Smartphone size={18} color={colors.text} />
        </Pressable>

        <Pressable onPress={onShowQR} style={styles.iconButton}>
          <QrCode size={18} color={colors.text} />
        </Pressable>

        <Pressable onPress={onDelete} style={[styles.iconButton, styles.iconButtonDanger]}>
          <Trash2 size={18} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  headerButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.secondaryDark,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.primary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 24,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primaryLight}50`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroText: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.secondaryDark,
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  optionChipTextSelected: {
    color: "white",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    padding: 2,
  },
  toggleOn: {
    backgroundColor: colors.primary,
    alignItems: "flex-end",
  },
  toggleOff: {
    backgroundColor: colors.gray200,
    alignItems: "flex-start",
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
  },
  qrContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  qrCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textLight,
    marginTop: 24,
    textAlign: "center",
  },
  qrExpiry: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  qrExpiryText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 4,
  },
  qrButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  badgeOutline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeOutlineText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textLight,
  },
  badgeSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  badgeSecondaryText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  },
  viewCount: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  viewCountText: {
    fontSize: 13,
    color: colors.textLight,
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonPrimary: {
    backgroundColor: `${colors.primaryLight}80`,
  },
  actionButtonSuccess: {
    backgroundColor: colors.successLight,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    marginLeft: 8,
  },
  actionButtonTextSuccess: {
    color: colors.success,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray100,
  },
  iconButtonDanger: {
    backgroundColor: colors.dangerLight,
  },
});
