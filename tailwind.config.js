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
          dark: "#7A3350",
        },
        secondary: {
          DEFAULT: "#757575",
          dark: "#43344F",
        },
        success: {
          DEFAULT: "#28A745",
          light: "#E8F5E9",
        },
        danger: {
          DEFAULT: "#DC3545",
          light: "#F8D7DA",
        },
        warning: {
          DEFAULT: "#FFC107",
          light: "#FFF3CD",
        },
        background: "#FFFFFF",
        text: {
          DEFAULT: "#374151",
          light: "#6B7280",
        },
        border: "#E0E0E0",
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
