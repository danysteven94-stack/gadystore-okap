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
        line: "#E4E6EB",
        mist: "#F0F2F5",
        canvas: "#F6F7F9",
        dark: {
          bg: "#0B0C0E",
          surface: "#15171B",
          border: "#25282E",
        },
      },
      fontFamily: {
        // Tit yo itilize menm fanmi ak rès tèks la pou yon gade pi sobr
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,17,21,0.05), 0 4px 12px -6px rgba(15,17,21,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
