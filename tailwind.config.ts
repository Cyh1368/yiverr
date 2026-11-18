import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        yale: {
          DEFAULT: "#00356B",
          dark: "#002349",
          soft: "#E6EEF6",
        },
        paper: "#F3F0E8",
        ink: "#16202A",
        gold: "#8C6A2F",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,53,107,0.06), 0 12px 32px rgba(0,53,107,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
