import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
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
  ChevronRight,
} from "lucide-react-native";
import { useShareLinks, getShareUrl } from "../lib/hooks/useShareLinks";
import { Button } from "./Button";
import { Card } from "./Card";
import { Badge } from "./Badge";
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
  const { links, loading, fetchLinks, createShareLink, deleteShareLink } =
    useShareLinks(testResultId);

  const [view, setView] = useState<"list" | "create" | "qr">("list");
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
      // Reset form
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
    (l) => new Date(l.expires_at) > new Date() &&
      (l.max_views === null || l.view_count < l.max_views)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <Pressable
            onPress={() => {
              if (view === "create" || view === "qr") setView("list");
              else onClose();
            }}
            className="p-2 -ml-2"
          >
            {view === "list" ? (
              <X size={24} color="#374151" />
            ) : (
              <Text className="text-primary font-inter-medium">Back</Text>
            )}
          </Pressable>
          <Text className="text-lg font-inter-semibold text-secondary-dark">
            {view === "create"
              ? "New Share Link"
              : view === "qr"
              ? "QR Code"
              : "Share Result"}
          </Text>
          <View className="w-10" />
        </View>

        {/* List View */}
        {view === "list" && (
          <ScrollView className="flex-1 px-6 py-6">
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-primary-light/30 rounded-full items-center justify-center mb-4">
                <LinkIcon size={32} color="#923D5C" />
              </View>
              <Text className="text-text-light font-inter-regular text-center">
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
              <ActivityIndicator size="large" color="#923D5C" className="mt-8" />
            ) : activeLinks.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-text-light font-inter-regular">
                  No active share links
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-lg font-inter-bold text-secondary-dark mb-4">
                  Active Links ({activeLinks.length})
                </Text>
                <View className="gap-3">
                  {activeLinks.map((link) => (
                    <ShareLinkCard
                      key={link.id}
                      link={link}
                      onCopy={() => handleCopy(link)}
                      onDelete={() => handleDelete(link)}
                      onShowQR={() => handleShowQR(link)}
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
          <ScrollView className="flex-1 px-6 py-6">
            {/* Expiry */}
            <View className="mb-6">
              <Text className="text-text font-inter-semibold mb-3">
                Link Expires After
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.hours}
                    onPress={() => setSelectedExpiry(opt)}
                    className={`px-4 py-3 rounded-2xl border ${
                      selectedExpiry.hours === opt.hours
                        ? "bg-primary border-primary"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`font-inter-medium ${
                        selectedExpiry.hours === opt.hours
                          ? "text-white"
                          : "text-text"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* View Limit */}
            <View className="mb-6">
              <Text className="text-text font-inter-semibold mb-3">
                Maximum Views
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {VIEW_LIMIT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => setSelectedViewLimit(opt)}
                    className={`px-4 py-3 rounded-2xl border ${
                      selectedViewLimit.value === opt.value
                        ? "bg-primary border-primary"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`font-inter-medium ${
                        selectedViewLimit.value === opt.value
                          ? "text-white"
                          : "text-text"
                      }`}
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
              className="flex-row items-center justify-between p-4 bg-white rounded-2xl border border-border mb-8"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-gray-100 p-2 rounded-xl mr-3">
                  <User size={20} color="#374151" />
                </View>
                <View className="flex-1">
                  <Text className="text-text font-inter-medium">
                    Show Your Name
                  </Text>
                  <Text className="text-text-light text-sm font-inter-regular">
                    Display your name on shared result
                  </Text>
                </View>
              </View>
              <View
                className={`w-12 h-7 rounded-full justify-center ${
                  showName ? "bg-primary items-end" : "bg-gray-200 items-start"
                }`}
              >
                <View className="w-5 h-5 bg-white rounded-full m-1 shadow-sm" />
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
          <View className="flex-1 px-6 py-6 items-center justify-center">
            <Card className="p-8 items-center">
              <QRCode
                value={getShareUrl(qrLink.token)}
                size={220}
                color="#374151"
                backgroundColor="white"
              />
              <Text className="text-text-light font-inter-medium mt-6 text-center">
                Scan to view shared result
              </Text>
              <View className="flex-row items-center mt-2">
                <Clock size={14} color="#6B7280" />
                <Text className="text-text-light text-sm ml-1">
                  {formatExpiry(qrLink.expires_at)}
                </Text>
              </View>
            </Card>

            <Button
              label={copiedId === qrLink.id ? "Copied!" : "Copy Link"}
              variant="secondary"
              icon={
                copiedId === qrLink.id ? (
                  <Check size={20} color="#923D5C" />
                ) : (
                  <Copy size={20} color="#923D5C" />
                )
              }
              onPress={() => handleCopy(qrLink)}
              className="mt-6"
              textClassName="text-primary"
            />
          </View>
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
  copied,
  formatExpiry,
}: {
  link: ShareLink;
  onCopy: () => void;
  onDelete: () => void;
  onShowQR: () => void;
  copied: boolean;
  formatExpiry: (exp: string) => string;
}) {
  return (
    <Card className="p-4">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Badge label={formatExpiry(link.expires_at)} variant="outline" />
            {link.show_name && (
              <Badge label="Name visible" variant="secondary" />
            )}
          </View>
          <View className="flex-row items-center mt-2">
            <Eye size={14} color="#6B7280" />
            <Text className="text-text-light text-sm ml-1">
              {link.view_count} view{link.view_count !== 1 ? "s" : ""}
              {link.max_views && ` / ${link.max_views} max`}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={onCopy}
          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
            copied ? "bg-success-light" : "bg-primary-light/50"
          }`}
        >
          {copied ? (
            <Check size={18} color="#28A745" />
          ) : (
            <Copy size={18} color="#923D5C" />
          )}
          <Text
            className={`font-inter-medium ml-2 ${
              copied ? "text-success" : "text-primary"
            }`}
          >
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onShowQR}
          className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-gray-100"
        >
          <QrCode size={18} color="#374151" />
        </Pressable>

        <Pressable
          onPress={onDelete}
          className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-danger-light"
        >
          <Trash2 size={18} color="#DC3545" />
        </Pressable>
      </View>
    </Card>
  );
}

