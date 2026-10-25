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
        // "Pavillons" theme
        pav: {
          navy: "#0C1823",
          "navy-2": "#16283A",
          chalk: "#F5F3EE",
          sand: "#ECE8DF",
          line: "#DDD8CD",
          yellow: "#F2C230",
          blue: "#1D4FA0",
          ink: "#2E3A46",
          muted: "#4E5A66",
          "muted-dark": "#C3CCD5",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ['"Lato"', "sans-serif"],
        // "Pavillons" theme
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
