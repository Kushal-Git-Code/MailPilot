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
        // Plus Jakarta Sans for body/UI text; Baloo 2 (font-display) is
        // applied selectively to headings/numbers/buttons only, never body
        // copy — keeps dense lists readable while headings carry personality.
        sans: ["var(--font-jakarta)", "sans-serif"],
        display: ["var(--font-baloo)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand palette — docs/ui-ux-brief.md (2026-08-24 revision, sourced
        // from the user's own login page + Phase 8 design-system review).
        // accent/secondary/tertiary keep their old names so every existing
        // className (bg-accent, text-accent, etc.) picks up the new colors
        // automatically; coral/gold/violet/sky/rose are the same values
        // exposed directly for new category-color work.
        accent: { DEFAULT: "#FF6B6B", hover: "#E85A5A" },
        secondary: "#D9A056",
        tertiary: "#7C6BFF",
        coral: "#FF6B6B",
        gold: { DEFAULT: "#D9A056", light: "#F0C68C" },
        violet: "#7C6BFF",
        sky: "#4D96FF",
        rose: "#D9578A",
        surface: "#FFFFFF",
        "surface-tint": "#FFF1E6",
        "text-secondary": "#63709A",
        border: "#F0E0D2",
        error: "#E5484D",
        success: "#2FAE66",
      },
      boxShadow: {
        glow: "0 8px 24px rgba(255, 107, 107, 0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
