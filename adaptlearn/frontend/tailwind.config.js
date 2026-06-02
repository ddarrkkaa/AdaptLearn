/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],

  corePlugins: { preflight: false },
  prefix: "tw-",
  theme: {
    extend: {
      colors: {
        "neuro-bg": "rgb(var(--neuro-bg-rgb) / <alpha-value>)",
        "neuro-bg-2": "rgb(var(--neuro-bg-2-rgb) / <alpha-value>)",
        "neuro-bg-3": "rgb(var(--neuro-bg-2-rgb) / <alpha-value>)",
        "neuro-card": "rgb(var(--neuro-card-rgb) / <alpha-value>)",
        "neuro-border": "rgb(var(--neuro-border-rgb) / <alpha-value>)",
        "neuro-text": "rgb(var(--neuro-text-rgb) / <alpha-value>)",
        "neuro-muted": "rgb(var(--neuro-muted-rgb) / <alpha-value>)",
        "neuro-dim": "rgb(var(--neuro-dim-rgb) / <alpha-value>)",

        "neuro-teal": "#00E6C8",
        "neuro-gold": "#E8B923",
        "neuro-coral": "#FF5E7A",
      },
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Display"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neuro-glow":
          "0 0 24px rgba(0, 230, 200, 0.18), inset 0 0 20px rgba(0, 230, 200, 0.04)",
        "neuro-glow-lg":
          "0 0 40px rgba(0, 230, 200, 0.30), inset 0 0 30px rgba(0, 230, 200, 0.08)",
        "neuro-gold":
          "0 0 24px rgba(232, 185, 35, 0.20), inset 0 0 20px rgba(232, 185, 35, 0.05)",
        "neuro-coral":
          "0 0 24px rgba(255, 94, 122, 0.18), inset 0 0 20px rgba(255, 94, 122, 0.04)",
        "neuro-soft":
          "0 8px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)",
        "neuro-inset":
          "inset 0 2px 8px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "neuro-grid":
          "radial-gradient(circle at 0.5px 0.5px, rgba(0,230,200,0.08) 1px, transparent 1px)",
        "neuro-radial":
          "radial-gradient(ellipse at top, rgba(0,230,200,0.06), transparent 60%)",
        "neuro-card-gradient":
          "linear-gradient(160deg, rgba(0,230,200,0.05) 0%, rgba(11,12,19,0.6) 50%, rgba(232,185,35,0.03) 100%)",
      },
      animation: {
        "pulse-soft": "pulse-soft 3.5s ease-in-out infinite",
        drift: "drift 18s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "wave-pulse": "wave-pulse 1.8s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%,100%": { opacity: "0.55", filter: "blur(0.4px)" },
          "50%": { opacity: "1", filter: "blur(0px)" },
        },
        drift: {
          "0%,100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-6px) translateX(3px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "wave-pulse": {
          "0%,100%": { transform: "scaleY(0.75)", opacity: "0.7" },
          "50%": { transform: "scaleY(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
