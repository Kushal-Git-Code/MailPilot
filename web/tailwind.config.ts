import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand palette — docs/ui-ux-brief.md (2026-08-22 cheerful/colorful revision)
        accent: { DEFAULT: "#6366F1", hover: "#4F46E5" },
        secondary: "#FB923C",
        tertiary: "#2DD4BF",
        surface: "#FFFFFF",
        "text-secondary": "#6B7280",
        border: "#E5E0FF",
        error: "#EF4444",
        success: "#22C55E",
      },
      boxShadow: {
        glow: "0 8px 24px rgba(99, 102, 241, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
