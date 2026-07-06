import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effaf4",
          100: "#d8f3e3",
          200: "#b4e6cb",
          300: "#83d2ac",
          400: "#4fb789",
          500: "#2c9c6e",
          600: "#1e7d58",
          700: "#186449",
          800: "#16503b",
          900: "#134232",
          950: "#09251c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
