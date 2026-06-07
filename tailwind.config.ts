import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#241812",
        paper: "#F8F1E5",
        bone: "#EFE2CF",
        ledger: "#D6C0A2",
        docket: "#6B533E",
        walnut: "#5A321F",
        brief: "#0F5C5C",
        pine: "#0A3F3E",
        amber: "#B06A24",
        seal: "#9D3730",
        vellum: "#FFF9EF"
      },
      boxShadow: {
        hairline: "0 0 0 1px rgba(90, 50, 31, 0.12)",
        panel: "0 22px 60px rgba(63, 38, 24, 0.12)",
        lift: "0 14px 30px rgba(63, 38, 24, 0.1)"
      }
    }
  },
  plugins: []
};

export default config;
