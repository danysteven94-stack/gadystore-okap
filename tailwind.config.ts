import type { Config } from "tailwindcss";

// Palèt: blan, rouj ak nwa. Non yo (ink, paper, brick, gold, forest, night, dark)
// rete menm jan pou rès aplikasyon an pa kraze, men valè yo chanje.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#FFFFFF",
        brick: {
          DEFAULT: "#C8102E",
          dark: "#9E0C24",
        },
        // Ansyen "gold" ak "forest" kounye a swiv rouj/nwa/gri
        gold: {
          DEFAULT: "#C8102E",
          light: "#F3C4CB",
          dark: "#C8102E",
        },
        forest: {
          DEFAULT: "#111111",
          light: "#3A3A3A",
          muted: "#6B6B6B",
        },
        night: "#111111",
        line: "#E5E5E5",
        mist: "#F5F5F5",
        dark: {
          bg: "#0A0A0A",
          surface: "#141414",
          border: "#2A2A2A",
        },
      },
      fontFamily: {
        // Tit yo itilize menm fanmi ak rès tèks la pou yon gade pi sobr
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
