import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aqi: {
          good: "#10b981", // green-500
          satisfactory: "#84cc16", // lime-500
          moderate: "#eab308", // yellow-500
          poor: "#f97316", // orange-500
          veryPoor: "#ef4444", // red-500
          severe: "#7f1d1d", // red-900 / dark maroon
        },
      },
    },
  },
  plugins: [],
};

export default config;
