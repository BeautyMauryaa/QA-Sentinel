/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0E11",
        panel: "#11151A",
        panelborder: "#1F262E",
        steel: "#7C8A99",
        mist: "#C7D0D9",
        signal: {
          pass: "#3FB950",
          fail: "#F85149",
          skip: "#D9A33D",
          run: "#58A6FF",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
