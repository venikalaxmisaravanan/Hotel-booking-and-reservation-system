/** @type {import('tailwindcss').Config} */
// Every color/radius/spacing value here is copied directly from the
// Stitch export's DESIGN.md so the app matches the mockups exactly
// rather than approximating them with Tailwind's default palette.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#434655",
        outline: "#737686",
        "outline-variant": "#c3c6d7",
        primary: "#004ac6",
        "on-primary": "#ffffff",
        "primary-container": "#2563eb",
        secondary: "#5c5f61",
        "secondary-container": "#e0e3e5",
        tertiary: "#943700",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        background: "#f8f9ff",

        // Room status palette (DESIGN.md > Room Status Logic)
        "status-available": "#16a34a",
        "status-available-bg": "#dcfce7",
        "status-reserved": "#004ac6",
        "status-reserved-bg": "#dbe1ff",
        "status-occupied": "#c2410c",
        "status-occupied-bg": "#ffedd5",
        "status-extended": "#7c3aed",
        "status-extended-bg": "#ede9fe",
        "status-released": "#0891b2",
        "status-released-bg": "#cffafe",
        "status-cleaning": "#64748b",
        "status-cleaning-bg": "#f1f5f9",
      },
      fontFamily: {
        display: ["Hanken Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "title-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-md": ["15px", { lineHeight: "22px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
        "mono-data": ["13px", { lineHeight: "18px", fontWeight: "500" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
      },
      maxWidth: {
        container: "1440px",
      },
      width: {
        sidebar: "260px",
      },
      boxShadow: {
        level1: "0 4px 12px rgba(15, 23, 42, 0.05)",
        level2: "0 12px 32px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};
