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
        // Brand palette — docs/ui-ux-brief.md
        accent: { DEFAULT: "#4A6B5C", hover: "#3A5548" },
        surface: "#FFFFFF",
        "text-secondary": "#6B7268",
        border: "#E8E4DB",
        error: "#B3543F",
      },
    },
  },
  plugins: [],
};
export default config;
