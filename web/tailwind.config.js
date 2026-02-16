/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light section
        "bg-light": "#FBF7F5",
        "text-primary": "#2A1A21",
        "text-secondary": "#6B5A62",
        "text-tertiary": "#9A8B92",
        // Dark section
        "bg-dark": "#1C1418",
        "text-primary-dark": "#F5EDE8",
        "text-secondary-dark": "rgba(245, 237, 232, 0.7)",
        // Brand
        burgundy: "#923D5C",
        "burgundy-light": "#EAC4CE",
        "burgundy-dark": "#6B2D45",
        coral: "#E8625C",
        "coral-hover": "#D4534D",
        // Semantic
        success: "#5A9A7A",
        danger: "#C4453A",
        // Surface (for dark sections — cards, inputs)
        surface: "#241C20",
        "surface-light": "#352A30",
        // Legacy (used by share/status/admin/privacy/terms pages — not landing page)
        background: "#0D0B0E",
        accent: "#FF2D7A",
        "accent-coral": "#FF6B8A",
        "accent-lavender": "#C9A0DC",
        "accent-mint": "#00E5A0",
        "accent-purple": "#A855F7",
      },
      fontFamily: {
        display: ["'Satoshi'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
