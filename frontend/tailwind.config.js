/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#0A0A12',
          900: '#0E0E18',
          800: '#12121E',
          700: '#1A1A2E',
          600: '#252540',
          500: '#363654',
        },
        brand: {
          700: '#059669',
          600: '#10B981',
          500: '#34D399',
          400: '#6EE7B7',
          300: '#A7F3D0',
          200: '#D1FAE5',
        },
        accent: {
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
