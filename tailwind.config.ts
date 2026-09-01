import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#211F3D",
        paper: "#F7F6FB",
        gold: {
          DEFAULT: "#F2A93B",
          light: "#FBD9A0",
          dark: "#B9761E",
        },
        forest: {
          DEFAULT: "#4F3CC9",
          light: "#6D5AE0",
          muted: "#8A85B0",
        },
        brick: "#E14F64",
        // Mode fonse — fon prèske nwa ak yon tint vyolèt, sifas kat yo yon ti
        // jan pi klè pou kenbe yerachi vizyèl la san yo pa vin gri plat.
        dark: {
          bg: "#131120",
          surface: "#1D1A33",
          border: "#332F52",
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
