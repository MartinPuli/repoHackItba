import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        card: "rgba(255, 255, 255, 0.05)",
        "card-border": "rgba(255, 255, 255, 0.1)",
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        accent: {
          green: "#00ff88",
          cyan: "#00e5ff",
          magenta: "#ff00aa",
          orange: "#ff6b35",
          red: "#ff4444",
          yellow: "#ffe600",
        },
        muted: {
          DEFAULT: "#888888",
          foreground: "#a1a1a1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backdropBlur: {
        glass: "12px",
      },
      borderRadius: {
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
