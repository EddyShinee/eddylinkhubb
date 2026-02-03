/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Modern Midnight Palette from UI templates
        main: "#0F172A",
        sidebar: "#1E293B",
        card: "rgba(30, 41, 59, 0.7)",
        "card-hover": "rgba(51, 65, 85, 0.8)",
        accent: "#818CF8",
        "accent-glow": "rgba(129, 140, 248, 0.3)",
        primary: "#1152d4",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "input-bg-dark": "#192233",
        "input-border-dark": "#324467",
        "input-text-placeholder": "#92a4c9",
        text: {
          primary: "#F1F5F9",
          secondary: "#94A3B8",
          muted: "#64748B",
        },
        border: "rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'subtle': '0 2px 10px rgba(0,0,0,0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [],
}
