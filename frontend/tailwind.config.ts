import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "#4F6EF7",
        "accent-hover": "#3B55D9",
        surface: "#F7F8FA",
        "border-subtle": "#E4E7EC",
        "text-primary": "#0F172A",
        "text-muted": "#64748B",
        verified: "#16A34A",
        risk: "#D97706",
        unverified: "#DC2626",
      },
      fontFamily: {
        sans: ["Fira Sans", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
