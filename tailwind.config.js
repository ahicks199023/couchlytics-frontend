// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}', // ✅ Picks up anything in /app
    './src/pages/**/*.{js,ts,jsx,tsx}', // If you're also using /pages
    './src/components/**/*.{js,ts,jsx,tsx}', // ✅ Picks up components
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#39FF14',
      },
      ringColor: {
        'neon-green': '#39FF14', // Enables `ring-neon-green`
      },
    },
  },
  plugins: [],
}
