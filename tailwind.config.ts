import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0a0e17",
        panel: "#111827",
        card: "#1a2234",
        elevated: "#243049",
        toyota: "#dc2626",
        eng: "#0ea5e9",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        ontrack: "#06b6d4",
        "text-primary": "#f1f5f9",
        "text-secondary": "#64748b",
        "text-muted": "#475569",
        border: "#1e293b",
        "surface-hover": "#1e293b",
      },
      fontFamily: {
        sans: ['"Instrument Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      maxWidth: {
        content: "1600px",
      },
    },
  },
  plugins: [],
};
export default config;
