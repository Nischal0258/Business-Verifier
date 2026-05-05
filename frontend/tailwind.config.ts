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
        background: {
          DEFAULT: "var(--background)",
          elevated: "var(--background-elevated)",
          muted: "var(--background-muted)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-muted)",
          subtle: "var(--foreground-subtle)",
          disabled: "var(--foreground-disabled)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
        },
        accent: {
          primary: {
            DEFAULT: "var(--accent-primary)",
            light: "var(--accent-primary-light)",
            dark: "var(--accent-primary-dark)",
            muted: "var(--accent-primary-muted)",
            subtle: "var(--accent-primary-subtle)",
          },
          secondary: {
            DEFAULT: "var(--accent-secondary)",
            light: "var(--accent-secondary-light)",
            dark: "var(--accent-secondary-dark)",
          },
          tertiary: {
            DEFAULT: "var(--accent-tertiary)",
            light: "var(--accent-tertiary-light)",
          },
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          hover: "var(--border-hover)",
          active: "var(--border-active)",
          focus: "var(--border-focus)",
        },
        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
          muted: "var(--success-muted)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          light: "var(--warning-light)",
          muted: "var(--warning-muted)",
        },
        error: {
          DEFAULT: "var(--error)",
          light: "var(--error-light)",
          muted: "var(--error-muted)",
        },
        info: "var(--info)",
        status: {
          verified: "var(--status-verified)",
          elevated: "var(--status-elevated)",
          unverified: "var(--status-unverified)",
        },
        card: {
          DEFAULT: "var(--bg-card)",
          hover: "var(--bg-card-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
        },
      },
      fontFamily: {
        sans: ["Fira Sans", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow)",
        "glow-strong": "var(--shadow-glow-strong)",
      },
      ringColor: {
        DEFAULT: "var(--accent-primary)",
      },
    },
  },
  plugins: [],
};
export default config;
