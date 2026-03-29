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
        background: "#f5f4f0",
        card: "#ffffff",
        "card-border": "#e3e1dc",
        canvas: {
          DEFAULT: "#f5f4f0",
          subtle: "#eae8e3",
          elevated: "#ffffff",
        },
        surface: {
          DEFAULT: "#ffffff",
          hover: "rgba(26, 26, 24, 0.04)",
          muted: "#f0efeb",
          raised: "#ffffff",
        },
        primary: {
          DEFAULT: "#1a7f5a",
          foreground: "#ffffff",
          light: "#e6f5ee",
          muted: "#d0ece0",
          dark: "#0f5c3e",
        },
        brand: "#1a7f5a",
        growth: "#1a7f5a",
        vault: {
          DEFAULT: "#0f1a14",
          light: "#1a2e22",
        },
        ink: {
          DEFAULT: "#1a1a18",
          muted: "#4a4a46",
          faint: "#7a7a74",
          ghost: "#a3a39c",
        },
        line: {
          DEFAULT: "#e3e1dc",
          strong: "#ccc9c2",
        },
        accent: {
          green: "#1a7f5a",
          red: "#d93025",
          orange: "#e37400",
          yellow: "#c49000",
        },
        alert: "#d93025",
        danger: {
          DEFAULT: "#d93025",
          light: "#fef0ef",
        },
        warning: {
          DEFAULT: "#e37400",
          light: "#fff7ed",
        },
        sidebar: {
          DEFAULT: "#0f1a14",
          hover: "rgba(255, 255, 255, 0.08)",
          active: "rgba(255, 255, 255, 0.14)",
          text: "#8a9e92",
          "text-active": "#ffffff",
        },
        muted: {
          DEFAULT: "#7a7a74",
          foreground: "#4a4a46",
        },
        pistachio: {
          DEFAULT: "#1a7f5a",
          light: "#d0ece0",
          muted: "#e6f5ee",
        },
        agent: "#e37400",
        cream: {
          DEFAULT: "#f5f4f0",
          warm: "#f5f4f0",
          green: "#f0efeb",
        },
      },
      fontFamily: {
        sans: ['"Outfit"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
      },
      borderRadius: {
        card: "14px",
        glass: "14px",
      },
      boxShadow: {
        panel: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "panel-hover": "0 4px 16px rgba(0, 0, 0, 0.08)",
        "card-rest": "0 1px 3px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)",
        "card-active": "0 2px 8px rgba(0, 0, 0, 0.06)",
        glow: "0 0 20px rgba(26, 127, 90, 0.12), 0 4px 20px rgba(0, 0, 0, 0.06)",
        "bottom-nav": "0 -1px 12px rgba(0, 0, 0, 0.06)",
        soft: "0 2px 12px rgba(0, 0, 0, 0.05)",
        "brand-sm": "0 2px 8px rgba(26, 127, 90, 0.2)",
        "brand-md": "0 4px 16px rgba(26, 127, 90, 0.25)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.3s ease-out both",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 6s ease-in-out infinite",
        "count-up": "count-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.95)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      screens: {
        xs: "475px",
      },
    },
  },
  plugins: [],
};

export default config;
