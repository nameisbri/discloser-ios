import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import {
  ChevronLeft,
  Link2,
  Plus,
  Copy,
  Check,
  Clock,
  X,
} from "lucide-react-native";
import { useAllShareLinks, getUnifiedShareUrl, useThemeColors } from "../../../lib/hooks";
import { useTheme } from "../../../context/theme";
import { HeaderLogo } from "../../../components/HeaderLogo";
import { SharedLinkCard } from "../../../components/SharedLinkCard";
import { StatusShareModal } from "../../../components/StatusShareModal";
import { isLinkExpired, getLinkExpirationStatus } from "../../../lib/utils/shareLinkStatus";
import type { UnifiedShareLink } from "../../../lib/types";

type FilterTab = "all" | "status" | "results";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "status", label: "Status" },
  { key: "results", label: "Results" },
];

export default function SharedLinksScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const { links, loading, error, refetch, deleteLink } = useAllShareLinks();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<UnifiedShareLink | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusShare, setShowStatusShare] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredLinks = useMemo(() => {
    if (activeFilter === "all") return links;
    if (activeFilter === "status") return links.filter((l) => l.type === "status");
    return links.filter((l) => l.type === "result");
  }, [links, activeFilter]);

  const activeLinks = useMemo(() => filteredLinks.filter((l) => !isLinkExpired(l)), [filteredLinks]);
  const expiredLinks = useMemo(() => filteredLinks.filter((l) => isLinkExpired(l)), [filteredLinks]);

  const handleCopy = useCallback(async (link: UnifiedShareLink) => {
    await Clipboard.setStringAsync(getUnifiedShareUrl(link));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDelete = useCallback(
    (link: UnifiedShareLink) => {
      Alert.alert(
        "Delete Link",
        "This will permanently disable this share link.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const success = await deleteLink(link.id, link.type);
              if (!success) {
                Alert.alert("Error", "Failed to delete the link. Please try again.");
              }
            },
          },
        ]
      );
    },
    [deleteLink]
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
        <Text
          className={`flex-1 text-center text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}
        >
          Shared Links
        </Text>
        <HeaderLogo />
      </View>

      {/* Filter Tabs + Create Button */}
      {links.length > 0 && (
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, gap: 8, marginBottom: 16 }}>
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: activeFilter === tab.key ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: activeFilter === tab.key ? colors.primary : colors.border,
              }}
              accessibilityLabel={`${tab.label}${activeFilter === tab.key ? ", selected" : ""}`}
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: activeFilter === tab.key ? "#fff" : colors.text,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setShowStatusShare(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 16,
              backgroundColor: colors.primary,
            }}
            accessibilityLabel="Create status link"
            accessibilityRole="button"
          >
            <Plus size={16} color="#fff" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff", marginLeft: 4 }}>
              Status
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#FF2D7A" : "#923D5C"}
          />
        }
      >
        {loading && links.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 64 }}
          />
        ) : error ? (
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <Text style={{ fontSize: 15, color: colors.danger, textAlign: "center", marginBottom: 16 }}>
              {error}
            </Text>
            <Pressable
              onPress={refetch}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primaryLight,
              }}
            >
              <Text style={{ fontWeight: "600", color: colors.primary }}>Try Again</Text>
            </Pressable>
          </View>
        ) : links.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Link2 size={32} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              No shared links yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                paddingHorizontal: 32,
                marginBottom: 24,
              }}
            >
              When you share a test result or your status, your links will appear here.
            </Text>
            <Pressable
              onPress={() => setShowStatusShare(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: colors.primary,
              }}
              accessibilityLabel="Share your status"
              accessibilityRole="button"
            >
              <Plus size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff", marginLeft: 8 }}>
                Share Your Status
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Active Links */}
            {activeLinks.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 12,
                  }}
                >
                  Active Links ({activeLinks.length})
                </Text>
                {activeLinks.map((link) => (
                  <SharedLinkCard
                    key={link.id}
                    link={link}
                    onCopy={() => handleCopy(link)}
                    onShowQR={() => setQrLink(link)}
                    onDelete={() => handleDelete(link)}
                    copied={copiedId === link.id}
                    isExpired={false}
                    expirationStatus="active"
                    colors={colors}
                  />
                ))}
              </>
            )}

            {/* Expired Links */}
            {expiredLinks.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.textSecondary,
                    marginTop: activeLinks.length > 0 ? 8 : 0,
                    marginBottom: 12,
                  }}
                >
                  Expired Links ({expiredLinks.length})
                </Text>
                {expiredLinks.map((link) => (
                  <SharedLinkCard
                    key={link.id}
                    link={link}
                    onCopy={() => {}}
                    onShowQR={() => {}}
                    onDelete={() => handleDelete(link)}
                    copied={false}
                    isExpired={true}
                    expirationStatus={getLinkExpirationStatus(link)}
                    colors={colors}
                  />
                ))}
              </>
            )}

            {/* Empty filter state */}
            {activeLinks.length === 0 && expiredLinks.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                  No {activeFilter === "status" ? "status" : "result"} links found
                </Text>
              </View>
            )}

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={qrLink !== null} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: 24,
              padding: 24,
              margin: 24,
              width: "85%",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "flex-end", width: "100%", marginBottom: 8 }}>
              <Pressable
                onPress={() => setQrLink(null)}
                style={{ padding: 8 }}
                accessibilityLabel="Close QR code"
                accessibilityRole="button"
              >
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {qrLink && (
              <>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    padding: 24,
                    borderRadius: 16,
                    alignItems: "center",
                  }}
                >
                  <QRCode
                    value={getUnifiedShareUrl(qrLink)}
                    size={200}
                    color={colors.text}
                    backgroundColor={colors.surface}
                  />
                </View>

                <Text
                  style={{
                    marginTop: 16,
                    color: colors.textSecondary,
                    textAlign: "center",
                    fontSize: 15,
                    fontWeight: "500",
                  }}
                >
                  Point, scan, done
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 4 }}>
                    {(() => {
                      const diff = new Date(qrLink.expires_at).getTime() - Date.now();
                      if (diff <= 0) return "Expired";
                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      if (hours < 24) return `${hours}h left`;
                      return `${Math.floor(hours / 24)}d left`;
                    })()}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleCopy(qrLink)}
                  style={{
                    marginTop: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    width: "100%",
                  }}
                  accessibilityLabel={copiedId === qrLink.id ? "Copied to clipboard" : "Copy share link"}
                  accessibilityRole="button"
                >
                  {copiedId === qrLink.id ? (
                    <Check size={18} color="#fff" />
                  ) : (
                    <Copy size={18} color="#fff" />
                  )}
                  <Text style={{ marginLeft: 8, color: "#fff", fontWeight: "600" }}>
                    {copiedId === qrLink.id ? "Copied!" : "Copy Link"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
      <StatusShareModal
        visible={showStatusShare}
        onClose={() => {
          setShowStatusShare(false);
          refetch();
        }}
      />
    </SafeAreaView>
  );
}
