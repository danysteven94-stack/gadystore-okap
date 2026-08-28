import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#12332E",
        paper: "#FAF9F6",
        gold: {
          DEFAULT: "#C08829",
          light: "#E9C98B",
          dark: "#8A5F17",
        },
        forest: {
          DEFAULT: "#12332E",
          light: "#1D5148",
          muted: "#6B7B76",
        },
        brick: "#A8432B",
        // Mode fonse — fon prèske nwa ak yon tint vèt fore, sifas kat yo yon ti
        // jan pi klè pou kenbe yerachi vizyèl la san yo pa vin gri plat.
        dark: {
          bg: "#0E1917",
          surface: "#152623",
          border: "#22403A",
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
