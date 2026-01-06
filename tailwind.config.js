/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
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
