// Shared theme colors hook
// Provides consistent color values for modals and components

import { useMemo } from "react";
import { useTheme } from "../../context/theme";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceLight: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
}

/**
 * Hook that provides consistent theme colors for components.
 * Automatically adjusts colors based on light/dark mode.
 *
 * @returns ThemeColors object with all color values
 */
export function useThemeColors(): ThemeColors {
  const { isDark } = useTheme();

  return useMemo(() => ({
    bg: isDark ? "#0D0B0E" : "#FAFAFA",
    surface: isDark ? "#1A1520" : "#FFFFFF",
    surfaceLight: isDark ? "#2D2438" : "#F3F4F6",
    border: isDark ? "#3D3548" : "#E5E7EB",
    text: isDark ? "#FFFFFF" : "#1F2937",
    textSecondary: isDark ? "rgba(255, 255, 255, 0.7)" : "#6B7280",
    textMuted: isDark ? "rgba(255, 255, 255, 0.4)" : "#9CA3AF",
    primary: isDark ? "#FF2D7A" : "#923D5C",
    primaryLight: isDark ? "rgba(255, 45, 122, 0.2)" : "#EAC4CE",
    success: "#10B981",
    successLight: isDark ? "rgba(16, 185, 129, 0.15)" : "#D1FAE5",
    danger: "#EF4444",
    dangerLight: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
    warning: "#F59E0B",
    warningLight: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
    info: isDark ? "#C9A0DC" : "#7C3AED",
    infoLight: isDark ? "rgba(201, 160, 220, 0.2)" : "#F3E8FF",
  }), [isDark]);
}
