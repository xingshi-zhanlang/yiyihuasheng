import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { d1, r2 } from '@emdash-cms/cloudflare';
import emdash from 'emdash/astro';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://hidream-pet.com',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    sitemap(),
    react(),
    emdash({
      database: d1({ binding: 'DB', session: 'auto' }),
      storage: r2({ binding: 'MEDIA' }),
      // Keep the first production migration plugin-free. Dynamic Worker
      // plugins are intentionally not enabled until the site is validated.
      plugins: [],
      toolbar: 'client',
      siteUrl: 'https://hidream-pet.com',
    }),
  ],
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
