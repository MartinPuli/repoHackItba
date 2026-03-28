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
        background: "#F9FCF7",
        card: "#FFFFF1",
        "card-border": "#D9EED8",
        canvas: {
          DEFAULT: "#F9FCF7",
          elevated: "#FFFFF1",
        },
        surface: {
          DEFAULT: "#FFFFF1",
          hover: "rgba(197, 237, 200, 0.45)",
          muted: "#D9EED8",
          raised: "#FFFFF1",
        },
        primary: {
          DEFAULT: "#96CCA8",
          foreground: "#142822",
        },
        pistachio: {
          DEFAULT: "#96CCA8",
          light: "#C5EDC8",
          muted: "#D9EED8",
        },
        cream: {
          DEFAULT: "#FFFFF1",
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
          DEFAULT: "rgba(30, 52, 44, 0.08)",
          strong: "rgba(30, 52, 44, 0.14)",
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
