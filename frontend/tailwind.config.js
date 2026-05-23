/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f0f14',
          800: '#1a1a24',
          700: '#252535',
          600: '#32324a',
          500: '#44445e',
        },
        brand: {
          600: '#4f46e5',
          500: '#6366f1',
          400: '#818cf8',
          300: '#a5b4fc',
        },
      },
    },
  },
  plugins: [],
};
