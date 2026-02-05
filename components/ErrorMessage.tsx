import React from "react";
import { View, Text, Pressable } from "react-native";
import {
  AlertCircle,
  WifiOff,
  AlertTriangle,
  ServerCrash,
  RefreshCw,
} from "lucide-react-native";
import { useTheme } from "../context/theme";
import { hapticImpact } from "../lib/utils/haptics";

type ErrorType = "network" | "validation" | "server" | "unknown";

interface ErrorMessageProps {
  /**
   * Error title displayed prominently
   */
  title: string;

  /**
   * Detailed error message
   */
  message: string;

  /**
   * Type of error for styling and icon selection
   * @default "unknown"
   */
  type?: ErrorType;

  /**
   * Callback for retry button (if provided, retry button is shown)
   */
  onRetry?: () => void;

  /**
   * Label for retry button
   * @default "Try Again"
   */
  retryLabel?: string;

  /**
   * Additional className for container
   */
  className?: string;
}

interface ErrorConfig {
  icon: React.ReactNode;
  iconBgLight: string;
  iconBgDark: string;
}

/**
 * ErrorMessage - Standardized error display component
 *
 * Features:
 * - Different icons based on error type
 * - Optional retry button
 * - Theme-aware styling
 * - Accessible error announcements
 */
export function ErrorMessage({
  title,
  message,
  type = "unknown",
  onRetry,
  retryLabel = "Try Again",
  className,
}: ErrorMessageProps) {
  const { isDark } = useTheme();

  const errorConfigs: Record<ErrorType, ErrorConfig> = {
    network: {
      icon: <WifiOff size={28} color={isDark ? "#F59E0B" : "#D97706"} />,
      iconBgLight: "bg-warning-light",
      iconBgDark: "bg-dark-warning-bg",
    },
    validation: {
      icon: <AlertTriangle size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />,
      iconBgLight: "bg-primary-muted",
      iconBgDark: "bg-dark-accent-muted",
    },
    server: {
      icon: <ServerCrash size={28} color={isDark ? "#EF4444" : "#DC2626"} />,
      iconBgLight: "bg-danger-light",
      iconBgDark: "bg-dark-danger-bg",
    },
    unknown: {
      icon: <AlertCircle size={28} color={isDark ? "#C9A0DC" : "#6B7280"} />,
      iconBgLight: "bg-gray-100",
      iconBgDark: "bg-dark-surface-light",
    },
  };

  const config = errorConfigs[type];

  const handleRetry = async () => {
    await hapticImpact("medium");
    onRetry?.();
  };

  return (
    <View
      className={`rounded-2xl p-6 border ${
        isDark
          ? "bg-dark-surface border-dark-border"
          : "bg-background-card border-border"
      } ${className || ""}`}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`Error: ${title}. ${message}`}
    >
      <View className="items-center">
        {/* Icon */}
        <View
          className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
            isDark ? config.iconBgDark : config.iconBgLight
          }`}
        >
          {config.icon}
        </View>

        {/* Title */}
        <Text
          className={`text-lg font-inter-bold text-center mb-2 ${
            isDark ? "text-dark-text" : "text-text"
          }`}
        >
          {title}
        </Text>

        {/* Message */}
        <Text
          className={`text-center font-inter-regular mb-4 ${
            isDark ? "text-dark-text-secondary" : "text-text-light"
          }`}
        >
          {message}
        </Text>

        {/* Retry Button */}
        {onRetry && (
          <Pressable
            onPress={handleRetry}
            className={`flex-row items-center px-6 py-3 rounded-xl ${
              isDark ? "bg-dark-accent-muted" : "bg-primary-muted"
            }`}
            accessibilityLabel={retryLabel}
            accessibilityRole="button"
            accessibilityHint="Attempts to retry the failed operation"
          >
            <RefreshCw
              size={18}
              color={isDark ? "#FF2D7A" : "#923D5C"}
              style={{ marginRight: 8 }}
            />
            <Text
              className={`font-inter-bold ${
                isDark ? "text-dark-accent" : "text-primary"
              }`}
            >
              {retryLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * NetworkError - Pre-configured error for network issues
 */
export function NetworkError({
  onRetry,
  message = "Please check your internet connection and try again.",
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <ErrorMessage
      title="Connection Error"
      message={message}
      type="network"
      onRetry={onRetry}
    />
  );
}

/**
 * ServerError - Pre-configured error for server issues
 */
export function ServerError({
  onRetry,
  message = "Something went wrong on our end. Please try again later.",
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <ErrorMessage
      title="Server Error"
      message={message}
      type="server"
      onRetry={onRetry}
    />
  );
}

/**
 * EmptyState - For when there's no data (not really an error, but similar pattern)
 */
export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { isDark } = useTheme();

  return (
    <View
      className={`rounded-2xl p-6 border ${
        isDark
          ? "bg-dark-surface border-dark-border"
          : "bg-background-card border-border"
      }`}
    >
      <View className="items-center">
        {icon && (
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isDark ? "bg-dark-surface-light" : "bg-gray-100"
            }`}
          >
            {icon}
          </View>
        )}
        <Text
          className={`text-lg font-inter-bold text-center mb-2 ${
            isDark ? "text-dark-text" : "text-text"
          }`}
        >
          {title}
        </Text>
        <Text
          className={`text-center font-inter-regular ${
            isDark ? "text-dark-text-secondary" : "text-text-light"
          }`}
        >
          {message}
        </Text>
        {action && <View className="mt-4">{action}</View>}
      </View>
    </View>
  );
}

export default ErrorMessage;
