/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#08080d',
          900: '#0c0c14',
          800: '#14141f',
          700: '#1e1e2e',
          600: '#2a2a3d',
          500: '#3d3d54',
        },
        brand: {
          700: '#4338ca',
          600: '#4f46e5',
          500: '#6366f1',
          400: '#818cf8',
          300: '#a5b4fc',
          200: '#c7d2fe',
        },
      },
    },
  },
  plugins: [],
};
