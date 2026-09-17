/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#16231D",
        mustard: "#E3A542",
        paper: "#F4EFE3",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Work Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
