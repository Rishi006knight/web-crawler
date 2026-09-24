import tailwindAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      colors: {
        space: {
          950: '#060911',
          900: '#0B0F19',
          850: '#111827',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        }
      }
    },
  },
  plugins: [tailwindAnimate],
}
