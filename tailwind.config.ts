import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0F1B3C",
        paper: "#F8F9FC",
        gold: {
          DEFAULT: "#F5A623",
          light: "#FBD38D",
          dark: "#B7791F",
        },
        forest: {
          DEFAULT: "#0EA672",
          light: "#34D399",
          muted: "#6B8FAE",
        },
        brick: "#E5484D",
        // Mode fonse — fon prèske nwa ak yon tint ble maren, sifas kat yo yon
        // ti jan pi klè pou kenbe yerachi vizyèl la san yo pa vin gri plat.
        dark: {
          bg: "#0A1220",
          surface: "#111B2E",
          border: "#22314A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
