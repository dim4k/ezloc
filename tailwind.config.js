/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        "breizh-navy": "#1e293b",
        "breizh-blue": "#3b82f6",
        sand: "#f3f4f6",
        accent: "#eab308",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ['"Lato"', "sans-serif"],
      },
    },
  },
  plugins: [],
}
