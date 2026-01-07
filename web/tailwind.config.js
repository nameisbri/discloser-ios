/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#923D5C",
        "primary-light": "#EAC4CE",
        success: "#10B981",
        "success-light": "#D1FAE5",
        danger: "#EF4444",
        "danger-light": "#FEE2E2",
        warning: "#F59E0B",
        "warning-light": "#FEF3C7",
      },
    },
  },
  plugins: [],
};
