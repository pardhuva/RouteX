/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        cyber: {
          dark: "#070913",
          card: "#0d1224",
          border: "#1e293b",
          cyan: "#06b6d4",
          emerald: "#10b981",
          accent: "#38bdf8",
        },
        ink: {
          950: "#05070f",
          900: "#0b0f19",
          800: "#111827",
          700: "#1f2937",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 24px -8px rgb(15 23 42 / 0.10)",
        card: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
        neon: "0 0 15px -2px rgba(6, 182, 212, 0.4)",
        "neon-emerald": "0 0 15px -2px rgba(16, 185, 129, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "radar-ping": "radarPing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "radar-ping-delayed": "radarPing 2.5s cubic-bezier(0, 0, 0.2, 1) 1.25s infinite",
        "dash-flow": "dashFlow 1.2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.55 },
        },
        radarPing: {
          "0%": { transform: "scale(0.8)", opacity: 0.8 },
          "70%": { transform: "scale(2.4)", opacity: 0 },
          "100%": { transform: "scale(2.5)", opacity: 0 },
        },
        dashFlow: {
          to: { strokeDashoffset: "-20" },
        },
      },
    },
  },
  plugins: [],
};

