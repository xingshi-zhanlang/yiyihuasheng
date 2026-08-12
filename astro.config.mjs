import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Astro 配置：静态生成（SSG）+ Tailwind v4 + sitemap + i18n
export default defineConfig({
  site: 'https://hidream-pet.com',
  integrations: [sitemap()],
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
