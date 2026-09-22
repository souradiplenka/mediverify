import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Natural Warm Trustworthy Healthcare Palette
        primary: {
          DEFAULT: "#0D9488",
          hover: "#0F766E",
          50: "#E0F7F5",
          100: "#CCF1EE",
          200: "#99E3DD",
          300: "#5CD1C6",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#092C28",
        },
        secondary: {
          DEFAULT: "#E0F7F5",
          hover: "#CCF1EE",
        },
        medicalBg: "#F8FAFA",
        surface: "#FFFFFF",
        mainText: "#12343B",
        secondaryText: "#64748B",
        medicalBorder: "#D9E7E7",
        accent: "#2563EB",
        success: "#16A34A",
        error: "#DC2626",

        // Map emerald & teal to exact requested Teal palette
        teal: {
          50: "#E0F7F5",
          100: "#CCF1EE",
          200: "#99E3DD",
          300: "#5CD1C6",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#092C28",
        },
        emerald: {
          50: "#E0F7F5",
          100: "#CCF1EE",
          200: "#99E3DD",
          300: "#5CD1C6",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#092C28",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
