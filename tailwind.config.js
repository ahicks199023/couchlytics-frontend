// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // ✅ Scans all files inside /src
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#39FF14',
      },
      ringColor: {
        'neon-green': '#39FF14', // ✅ This enables `ring-neon-green`
      },
    },
  },
  plugins: [],
};

