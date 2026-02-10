// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://pranayshrestha.com',
  integrations: [react()],
  adapter: vercel(),
  vite: {
    ssr: {
      noExternal: [],
    },
  },
});
