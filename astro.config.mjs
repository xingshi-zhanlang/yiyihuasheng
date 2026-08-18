import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { d1 } from '@emdash-cms/cloudflare';
import emdash, { local } from 'emdash/astro';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Keep the repository domain-neutral until the production .com domain is purchased.
// Cloudflare preview/production can provide PUBLIC_SITE_URL as an environment variable.
const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site: siteUrl,
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    sitemap(),
    react(),
    emdash({
      database: d1({ binding: 'DB', session: 'auto' }),
      // Zero-cost mode: no R2 binding. Existing/catalog media lives in public/.
      // The local adapter is kept only to satisfy EmDash's required storage interface;
      // durable runtime uploads are intentionally not promised in Worker deployments.
      storage: local({
        directory: './public/images/uploads',
        baseUrl: '/images/uploads',
      }),
      plugins: [],
      toolbar: 'client',
      siteUrl,
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
