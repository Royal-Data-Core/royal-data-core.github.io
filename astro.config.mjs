import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nexusdigital.com',
  experimental: {
    contentCollections: true,
  },
  vite: {
    optimizeDeps: {
      include: ['tailwindcss'],
    },
  },
});