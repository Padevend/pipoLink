/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#FF7A00",
        secondary: "#0D9488",
        background: {
          light: "#FAFAF8",
          dark: "#0A0F1A",
        },
        surface: {
          light: "#F3F0EB",
          dark: "#151E2E",
        },
        border: {
          light: "#EAE6DF",
          dark: "#1E2D45",
        },
        text: {
          primary: {
            light: "#1A1612",
            dark: "#EBF0F9",
          },
          secondary: {
            light: "#7A6F65",
            dark: "#7A93B8",
          },
        },
        accent: {
          muted: {
            light: "#FFF3E8",
            dark: "#1F1408",
          },
        },
        success: "#16A34A",
        error: "#DC2626",
        warning: "#D97706",
        info: "#2563EB",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};