import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        retro: {
          base: "#07060e",
          panel: "#121024",
          surface: "#1a1733",
          pink: "#ff36bd",
          cyan: "#00e5ff",
          yellow: "#ffe45e"
        }
      },
      boxShadow: {
        neon: "0 0 30px rgba(255, 54, 189, .16)"
      }
    }
  },
  plugins: []
};
export default config;