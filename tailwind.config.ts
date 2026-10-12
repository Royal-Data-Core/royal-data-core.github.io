import { defineConfig } from 'astro/tailwind';

export default defineConfig({
  content: ['./src/**/*.{js,ts,astro}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#4a4a4a',
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
});