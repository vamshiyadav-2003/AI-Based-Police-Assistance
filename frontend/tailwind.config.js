/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "Night desk" palette: deep ink navy base, signal-amber accent
        // (like a case file under a desk lamp), muted slate for structure.
        ink: {
          950: "#0B1120",
          900: "#111827",
          800: "#1B2536",
          700: "#28344A",
          600: "#3A4A66",
        },
        slate: {
          400: "#8B98AC",
          300: "#B4BECD",
        },
        signal: {
          amber: "#E8A33D",
          amberDim: "#C4842A",
          red: "#D65A5A",
          green: "#5FAE7C",
        },
      },
      fontFamily: {
        display: ["'IBM Plex Sans Condensed'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
