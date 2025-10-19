import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        hmi: {
          header: "hsl(var(--hmi-header))",
          background: "hsl(var(--hmi-background))",
          border: "hsl(var(--hmi-border))",
          panel: "hsl(var(--hmi-panel))",
        },
        equipment: {
          silo: "hsl(var(--equipment-silo))",
          siloFill: "hsl(var(--equipment-silo-fill))",
          tank: "hsl(var(--equipment-tank))",
          mixer: "hsl(var(--equipment-mixer))",
          conveyor: "hsl(var(--equipment-conveyor))",
          aggregate: "hsl(var(--equipment-aggregate))",
          stone: "hsl(var(--equipment-stone))",
          cement: "hsl(var(--equipment-cement))",
        },
        pipe: {
          material: "hsl(var(--pipe-material))",
          water: "hsl(var(--pipe-water))",
        },
        valve: {
          active: "hsl(var(--valve-active))",
          inactive: "hsl(var(--valve-inactive))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slide": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(20px)" },
        },
        "rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide": "slide 2s linear infinite",
        "rotate": "rotate 2s linear infinite",
        "spin-slow": "rotate 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
