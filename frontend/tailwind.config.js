/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        swan: "#E2F1F1",
        nordic: "#B7E5E4",
        seamist: "#D4EFEC",
        aqua: "#9CE5EA",
        capri: "#59D0E0",
        peacock: "#009AA6",
        viridian: "#006775",
        cerulean: "#2B82A4",
        saltwater: "#7EAEC4",
      },
      fontFamily: {
        display: ["DM Serif Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,103,117,0.06), 0 4px 16px rgba(0,103,117,0.08)",
        "card-lg": "0 4px 6px rgba(0,103,117,0.04), 0 12px 32px rgba(0,103,117,0.12)",
        "3d": "0 4px 6px -1px rgba(0,103,117,0.15), 0 2px 4px -2px rgba(0,103,117,0.1), 0 1px 0 0 rgba(255,255,255,0.5) inset",
        "3d-hover": "0 10px 15px -3px rgba(0,103,117,0.2), 0 4px 6px -4px rgba(0,103,117,0.1), 0 1px 0 0 rgba(255,255,255,0.6) inset",
      },
    },
  },
  plugins: [],
};