import type { Config } from "tailwindcss";

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
        obsidian: {
          950: "#050506",
          900: "#09090B",
          850: "#0E0E11",
          800: "#141418",
          700: "#1E1D1A",
          600: "#2A2823",
        },
        cream: {
          50: "#FDFBF7",
          100: "#F5EFE6",
          200: "#E8DEC8",
          300: "#D4C5A9",
          400: "#B8A686",
          500: "#96876B",
          600: "#6E624D",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
