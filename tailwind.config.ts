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
        midnight: "#060a13",
        panel: "#0c1220",
        card: "#0f172a",
        elevated: "#1e293b",
        toyota: "#dc2626",
        eng: "#3b82f6",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        ontrack: "#06b6d4",
        "text-primary": "#f1f5f9",
        "text-secondary": "#94a3b8",
        "text-muted": "#64748b",
        border: "#1e293b",
        "surface-hover": "rgba(30, 41, 59, 0.4)",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      maxWidth: {
        content: "1600px",
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(59, 130, 246, 0.2)",
        "glow-sm": "0 0 10px -3px rgba(59, 130, 246, 0.15)",
        card: "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
