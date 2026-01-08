/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: "#923D5C",
        "primary-light": "#EAC4CE",
        "primary-dark": "#6B2D45",
        "primary-muted": "#F9F0F3",
        // Dark mode surfaces
        background: "#0D0B0E",
        surface: "#1A1520",
        "surface-light": "#2D2438",
        // Creative accents
        accent: "#FF2D7A",
        "accent-coral": "#FF6B8A",
        "accent-lavender": "#C9A0DC",
        "accent-mint": "#00E5A0",
        "accent-purple": "#A855F7",
        // Semantic
        success: "#10B981",
        "success-light": "#D1FAE5",
        danger: "#EF4444",
        "danger-light": "#FEE2E2",
        warning: "#F59E0B",
        "warning-light": "#FEF3C7",
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
