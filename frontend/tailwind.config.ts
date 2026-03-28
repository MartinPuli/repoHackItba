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
        background: "#eef1ef",
        card: "#ffffff",
        "card-border": "#dce3de",
        canvas: {
          DEFAULT: "#eef1ef",
          elevated: "#ffffff",
        },
        surface: {
          DEFAULT: "#ffffff",
          hover: "rgba(15, 23, 18, 0.04)",
          muted: "#f0f4f1",
          raised: "#ffffff",
        },
        primary: {
          DEFAULT: "#96CCA8",
          foreground: "#0f1712",
        },
        pistachio: {
          DEFAULT: "#96CCA8",
          light: "#C5EDC8",
          muted: "#D9EED8",
        },
        cream: {
          DEFAULT: "#FFFFF1",
          warm: "#FFF9E6",
          green: "#f6f8f7",
        },
        brand: "#2d6b4f",
        growth: "#2d6b4f",
        vault: "#3d5c4f",
        agent: "#b45309",
        ink: {
          DEFAULT: "#0f1712",
          muted: "#3d4f45",
          faint: "#6b7f73",
        },
        line: {
          DEFAULT: "#dce3de",
          strong: "#b8c4bc",
        },
        accent: {
          green: "#2d6b4f",
          cyan: "#2d6b4f",
          red: "#c53030",
          orange: "#b45309",
          yellow: "#a16207",
        },
        alert: "#c53030",
        muted: {
          DEFAULT: "#6b7f73",
          foreground: "#3d4f45",
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["1.75rem", { lineHeight: "2.125rem", fontWeight: "600" }],
      },
      borderRadius: {
        card: "12px",
        glass: "12px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 18, 0.04)",
        "panel-hover": "0 4px 14px rgba(15, 23, 18, 0.07)",
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
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
