import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Keep the repository domain-neutral until the production .com domain is purchased.
// Cloudflare preview/production can provide PUBLIC_SITE_URL as an environment variable.
const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site: siteUrl,
  output: 'server',
  adapter: cloudflare(),
  integrations: [sitemap(), react()],
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
