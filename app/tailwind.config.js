/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        surface: "#121212",
        elevated: "#171717",
        cyan: "#00E5FF",
        crimson: "#E11D48",
        emerald: "#10B981",
        amber: "#F59E0B",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderColor: {
        subtle: "rgba(255,255,255,0.08)",
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "float-slow": "float-slow 5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "radial-out": "radial-out 1s ease-out forwards",
        "radial-out-fast": "radial-out-fast 0.5s ease-out forwards",
        "scan-line": "scan-line 5s linear infinite",
        "ring-expand": "ring-expand 1s ease-out forwards",
        "lock-pulse": "lock-pulse 1.5s ease-out",
        "crimson-pulse": "crimson-pulse 0.6s ease-out",
        "impact-flash": "impact-flash 0.5s ease-out forwards",
        orbit: "orbit 8s linear infinite",
        "orbit-slow": "orbit-slow 12s linear infinite",
        "type-cursor": "type-cursor 1s step-end infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.75)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-8px) rotate(1deg)" },
          "66%": { transform: "translateY(-4px) rotate(-0.5deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "radial-out": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(3.2)", opacity: "0" },
        },
        "radial-out-fast": {
          "0%": { transform: "scale(1)", opacity: "0.9" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "ring-expand": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "lock-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,229,255,0.4)" },
          "50%": { boxShadow: "0 0 0 10px rgba(0,229,255,0)" },
        },
        "crimson-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(225,29,72,0.5)" },
          "50%": { boxShadow: "0 0 0 14px rgba(225,29,72,0)" },
        },
        "impact-flash": {
          "0%": { opacity: "0" },
          "15%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        orbit: {
          "from": { transform: "rotate(0deg) translateX(60px) rotate(0deg)" },
          "to": { transform: "rotate(360deg) translateX(60px) rotate(-360deg)" },
        },
        "orbit-slow": {
          "from": { transform: "rotate(0deg) translateX(80px) rotate(0deg)" },
          "to": { transform: "rotate(-360deg) translateX(80px) rotate(360deg)" },
        },
        "type-cursor": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      boxShadow: {
        "glow-cyan": "0 0 12px rgba(0,229,255,0.25), 0 0 40px rgba(0,229,255,0.08)",
        "glow-crimson": "0 0 12px rgba(225,29,72,0.3), 0 0 40px rgba(225,29,72,0.1)",
        "glow-emerald": "0 0 12px rgba(16,185,129,0.25), 0 0 40px rgba(16,185,129,0.08)",
      },
    },
  },
  plugins: [],
};
