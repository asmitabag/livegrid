import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "hsl(var(--lg-surface))",
          2: "hsl(var(--lg-surface-2))"
        },
        border: "hsl(var(--lg-border))",
        text: {
          DEFAULT: "hsl(var(--lg-text))",
          muted: "hsl(var(--lg-text-muted))"
        }
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)"
      },
      borderRadius: {
        xl: "0.9rem"
      }
    }
  },
  plugins: []
};

export default config;