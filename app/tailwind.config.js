/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#FF7A00",
        secondary: "#14B8A6",
        background: {
          light: "#FFF",
          dark: "#040914",
        },
        surface: {
          light: "#f3f2f2",
          dark: "#1E293B",
        },
        border: {
          light: "#E5E7EB",
          dark: "#334155",
        },
        text: {
          primary: {
            light: "#111827",
            dark: "#F8FAFC",
          },
          secondary: {
            light: "#6B7280",
            dark: "#94A3B8",
          },
        },
        accent: {
          muted: {
            light: "#FFF0E0",
            dark: "#2D1A00",
          },
        },
        success: "#22C55E",
        error: "#EF4444",
        warning: "#EAB308",
        info: "#3B82F6",
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
