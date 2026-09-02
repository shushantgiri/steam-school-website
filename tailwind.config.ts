import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF9F4",
        ivory: "#F3EEE3",
        mist: "#E8E2D4",
        ink: { DEFAULT: "#101C33", soft: "#22304C" },
        charcoal: "#33383F",
        slate2: "#5B6472",
        teal: { 50: "#EAF4F1", 100: "#D3E8E2", 500: "#12907C", 600: "#0E7C6B", 700: "#0B6156", 900: "#093E38" },
        sun: { 300: "#F7CB63", 400: "#F2B72E", 100: "#FCEECB" },
      },
      fontFamily: { sans: ["var(--font-poppins)", "system-ui", "sans-serif"] },
      maxWidth: { shell: "76rem" },
      boxShadow: {
        soft: "0 1px 2px rgba(16,28,51,.05), 0 8px 24px -12px rgba(16,28,51,.12)",
        lift: "0 2px 4px rgba(16,28,51,.06), 0 20px 40px -20px rgba(16,28,51,.25)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
