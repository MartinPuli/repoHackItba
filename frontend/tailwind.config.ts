import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        card: "#FFFEF1",
        "card-border": "#D9EEDB",
        canvas: {
          DEFAULT: "#FFFFFF",
          elevated: "#F9FCF7",
        },
        surface: {
          DEFAULT: "#FFFEF1",
          hover: "rgba(150, 204, 168, 0.08)",
          muted: "#F9FCF7",
          raised: "#FFFEF1",
        },
        primary: {
          DEFAULT: "#96CCA8",
          foreground: "#FFFFFF",
        },
        pistachio: {
          DEFAULT: "#96CCA8",
          light: "#C5EDC8",
          muted: "#D9EEDB",
        },
        cream: {
          DEFAULT: "#FFFEF1",
          warm: "#FFF9E6",
          green: "#F9FCF7",
        },
        brand: "#96CCA8",
        growth: "#5a9e6e",
        vault: "#78b896",
        agent: "#5a9e6e",
        ink: {
          DEFAULT: "#1a2e1f",
          muted: "#5a7d64",
          faint: "#8fa898",
        },
        line: {
          DEFAULT: "#D9EEDB",
          strong: "#C5EDC8",
        },
        accent: {
          green: "#5a9e6e",
          cyan: "#6bb5a0",
          red: "#d46b6b",
          orange: "#d49a6b",
          yellow: "#c4a84d",
        },
        alert: "#d46b6b",
        muted: {
          DEFAULT: "#8fa898",
          foreground: "#5a7d64",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        card: "16px",
        glass: "16px",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "count-up": "count-up 0.5s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
