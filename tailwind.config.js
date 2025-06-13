// tailwind.config.js
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
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
};
