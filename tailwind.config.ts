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
        // Light enterprise palette
        background: "#F5F7FA",
        panel: "#FFFFFF",
        card: "#FFFFFF",
        elevated: "#F9FAFB",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#DBEAFE",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#06B6D4",
        // Text
        "text-primary": "#0F172A",
        "text-secondary": "#475569",
        "text-muted": "#64748B",
        // Borders
        border: "#E5E7EB",
        "border-strong": "#D1D5DB",
        "surface-hover": "#F3F4F6",
        // Status accents (soft pastels for calendar / status pills)
        "status-present": "#D1FAE5",
        "status-annual": "#DBEAFE",
        "status-medical": "#FEE2E2",
        "status-training": "#EDE9FE",
        "status-weekend-job": "#FEF3C7",
        "status-holiday-job": "#FEF9C3",
        "status-delayed": "#FECACA",
      },
      fontFamily: {
        sans: ['var(--font-inter)', "system-ui", "sans-serif"],
        mono: ['var(--font-mono)', "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "1600px",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        elevated: "0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
        "focus-ring": "0 0 0 4px rgba(37, 99, 235, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
