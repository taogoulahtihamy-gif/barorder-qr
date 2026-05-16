/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: { 400: '#d4a843', 500: '#c9952e', 600: '#b07d1a' },
        wave: { 400: '#00d4aa', 500: '#00b894', 600: '#00a07a' },
      },
    },
  },
  plugins: [],
};
