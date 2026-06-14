/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF4D00",
        secondary: "#2DD4BF",
        tertiary: "#FBBF24",
        background: "#081425",
        "on-background": "#d8e3fb",
        surface: "#081425",
        "surface-dim": "#081425",
        "surface-bright": "#2f3a4c",
        "surface-container-lowest": "#040e1f",
        "surface-container-low": "#111c2d",
        "surface-container": "#152031",
        "surface-container-high": "#1f2a3c",
        "surface-container-highest": "#2a3548",
        "on-surface": "#d8e3fb",
        "on-surface-variant": "#e6beb2",
        "outline": "#ad897e",
        "outline-variant": "#5c4037",
        error: "#ffb4ab",
        "on-error": "#690005",
      },
    },
  },
  plugins: [],
};