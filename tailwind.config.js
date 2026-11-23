/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dairy-primary': '#218838',
        'dairy-primary-dark': '#14532D',
        'dairy-tertiary': '#F4C542',
        'dairy-neutral': '#263238',
        'dairy-canvas': '#FFFDF5',
        'dairy-surface': '#FFFFFF',
        'dairy-tint': '#F3F7F1',
        'dairy-outline': '#E2E8F0',
      },
      fontFamily: {
        'outfit': ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'urdu': ['Noto Nastaliq Urdu', 'Noto Sans Arabic', 'serif'],
      },
    },
  },
  plugins: [],
}
