import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#C6FF00",
          50: "#f4ffe0",
          100: "#e7ffb8",
          200: "#d4ff73",
          300: "#C6FF00",
          400: "#a8d900",
          500: "#89b000",
          600: "#678500",
          700: "#4d6300",
          800: "#344200",
          900: "#1a2100",
        },
        surface: {
          DEFAULT: "#0B0E11",
          50: "#1a1f26",
          100: "#141920",
          200: "#0f131a",
          300: "#0B0E11",
        },
        border: "#1e2530",
        muted: "#6b7280",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [forms],
};

export default config;
