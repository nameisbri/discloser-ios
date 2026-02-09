import { View, Text, Pressable } from "react-native";
import {
  Eye,
  Copy,
  Check,
  Trash2,
  QrCode,
  MessageSquare,
} from "lucide-react-native";
import { getExpirationLabel, formatViewCount } from "../lib/utils/shareLinkStatus";
import { hapticNotification } from "../lib/utils/haptics";
import type { UnifiedShareLink } from "../lib/types";
import type { LinkExpirationStatus } from "../lib/utils/shareLinkStatus";
import type { ThemeColors } from "../lib/hooks";

interface SharedLinkCardProps {
  link: UnifiedShareLink;
  onCopy: () => void;
  onShowQR: () => void;
  onDelete: () => void;
  copied: boolean;
  isExpired: boolean;
  expirationStatus: LinkExpirationStatus;
  colors: ThemeColors;
}

function formatExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.max(1, Math.ceil(diff / (1000 * 60)));
    return `${minutes}m left`;
  }
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

function formatCreatedAt(dateStr: string): string {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export function SharedLinkCard({
  link,
  onCopy,
  onShowQR,
  onDelete,
  copied,
  isExpired,
  expirationStatus,
  colors,
}: SharedLinkCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: isExpired ? 0.65 : 1,
      }}
    >
      {/* Type badge + Expiration badge */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: link.type === "status" ? colors.infoLight : colors.primaryLight,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: link.type === "status" ? colors.info : colors.primary,
            }}
          >
            {link.type === "status" ? "Status" : "Result"}
          </Text>
        </View>

        {isExpired && (
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.warningLight }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.warning }}>
              {getExpirationLabel(expirationStatus)}
            </Text>
          </View>
        )}
      </View>

      {/* Label or fallback date header */}
      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 }}>
        {link.label || `Link created ${formatCreatedAt(link.created_at)}`}
      </Text>
      {link.label && (
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>
          {formatCreatedAt(link.created_at)}
        </Text>
      )}

      {/* Note preview (result links only) */}
      {link.note && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <MessageSquare size={12} color={colors.textSecondary} />
          <Text numberOfLines={1} style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4, flex: 1 }}>
            {link.note.length > 50 ? link.note.substring(0, 50) + "..." : link.note}
          </Text>
        </View>
      )}

      {/* Info pills row (active links only) */}
      {!isExpired && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textSecondary }}>
              {formatExpiry(link.expires_at)}
            </Text>
          </View>
          {link.show_name && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primaryLight }}>
              <Text style={{ fontSize: 12, fontWeight: "500", color: colors.primary }}>Name visible</Text>
            </View>
          )}
        </View>
      )}

      {/* View count */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Eye size={14} color={colors.textSecondary} />
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>
          {isExpired
            ? formatViewCount(link.view_count, link.max_views)
            : `${link.view_count} view${link.view_count !== 1 ? "s" : ""}${link.max_views ? ` / ${link.max_views} max` : ""}`}
        </Text>
      </View>

      {/* Action buttons */}
      {isExpired ? (
        <Pressable
          onPress={async () => {
            await hapticNotification("warning");
            onDelete();
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: colors.dangerLight,
          }}
          accessibilityLabel="Delete expired share link"
          accessibilityRole="button"
          accessibilityHint="Permanently deletes this expired share link"
        >
          <Trash2 size={18} color={colors.danger} />
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.danger, marginLeft: 8 }}>Delete</Text>
        </Pressable>
      ) : (
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
            accessibilityLabel={copied ? "Copied to clipboard" : "Copy share link"}
            accessibilityRole="button"
            accessibilityHint="Copies the share link to your clipboard"
          >
            {copied ? <Check size={18} color={colors.success} /> : <Copy size={18} color={colors.primary} />}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: copied ? colors.success : colors.primary,
                marginLeft: 8,
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onShowQR}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: colors.surfaceLight,
              minWidth: 44,
              minHeight: 44,
            }}
            accessibilityLabel="Show QR Code"
            accessibilityRole="button"
            accessibilityHint="Displays a QR code for this share link"
          >
            <QrCode size={18} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={async () => {
              await hapticNotification("warning");
              onDelete();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: colors.dangerLight,
              minWidth: 44,
              minHeight: 44,
            }}
            accessibilityLabel="Delete share link"
            accessibilityRole="button"
            accessibilityHint="Permanently deletes this share link"
          >
            <Trash2 size={18} color={colors.danger} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
