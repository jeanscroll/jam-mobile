const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./plasmic-library/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Si tu utilises `src/`
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          50: "#F4FFE6",
          100: "#E8FFCC",
          200: "#D1FE9A",
          300: "#BAFE67",
          400: "#A3FE34",
          500: "#BBFE68",
          600: "#70CB01",
          700: "#549801",
          800: "#386501",
          900: "#1C3300",
          950: "#0E1900",
        },
        pine: {
          50: "#E5FFE5",
          100: "#CFC",
          200: "#9F9",
          300: "#6F6",
          400: "#3F3",
          500: "#002400",
          600: "#0C0",
          700: "#090",
          800: "#060",
          900: "#030",
          950: "#001A00",
        },
        grey: {
          50: "#F2F2F2",
          100: "#E6E6E6",
          200: "#CCC",
          300: "#B3B3B3",
          400: "#999",
          500: "#C8C8C8",
          600: "#666",
          700: "#4D4D4D",
          800: "#333",
          900: "#1A1A1A",
          950: "#0D0D0D",
        },
        error: {
          25: "#FFFBFA",
          50: "#FEF3F2",
          100: "#FEE4E2",
          200: "#FECDCA",
          300: "#FDA29B",
          400: "#F97066",
          500: "#F04438",
          600: "#D92D20",
          700: "#B42318",
          800: "#912018",
          900: "#7A271A",
        },
        danger: {
          background: "#FCF1F1",
          border: "#F0A5A3",
          text: "#AB3832",
        },
        warning: {
          background: "#FDF9EB",
          border: "#F7D165",
          text: "#AD5B2B",
        },
        success: {
          background: "#F1FBF3",
          border: "#99E4A4",
          text: "#387C39",
        },
        information: {
          background: "#F5F0FD",
          border: "#A590F7",
          text: "#552A9B",
        },
      },
    },
  },
  plugins: [heroui()],
};
