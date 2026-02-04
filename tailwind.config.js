/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // === LIGHT MODE (Legacy) ===
        primary: {
          DEFAULT: "#923D5C",
          light: "#EAC4CE",
          dark: "#6B2D45",
          muted: "#F9F0F3",
        },
        secondary: {
          DEFAULT: "#757575",
          dark: "#2D2438",
        },
        accent: {
          DEFAULT: "#FF6B8A",
          soft: "#FFE4EA",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#059669",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        background: {
          DEFAULT: "#FAFAFA",
          card: "#FFFFFF",
        },
        text: {
          DEFAULT: "#1F2937",
          light: "#6B7280",
          muted: "#9CA3AF",
        },
        border: "#E5E7EB",

        // === DARK MODE (New - matches landing page vibe) ===
        dark: {
          // Surfaces
          bg: "#0D0B0E",
          surface: "#1A1520",
          "surface-light": "#2D2438",
          "surface-elevated": "#352D42",
          // Text - Updated for WCAG AAA compliance (14.76:1 contrast ratio)
          text: "#FFFFFF",
          "text-secondary": "rgba(255, 255, 255, 0.87)",
          "text-muted": "rgba(255, 255, 255, 0.6)",
          // Borders - Increased visibility
          border: "#52495D",
          "border-light": "rgba(255, 255, 255, 0.15)",
          // Brand - hot pink accent like landing page
          accent: "#FF2D7A",
          "accent-hover": "#FF4D8F",
          "accent-muted": "rgba(255, 45, 122, 0.2)",
          // Secondary accents
          coral: "#FF6B8A",
          lavender: "#C9A0DC",
          mint: "#00E5A0",
          purple: "#A855F7",
          // Semantic colors adjusted for dark
          success: "#10B981",
          "success-bg": "rgba(16, 185, 129, 0.15)",
          danger: "#EF4444",
          "danger-bg": "rgba(239, 68, 68, 0.15)",
          warning: "#F59E0B",
          "warning-bg": "rgba(245, 158, 11, 0.15)",
        },
      },
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
