import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel(),
  output: 'server',
  site: 'https://chiller-pecas.vercel.app',
  integrations: [
    sitemap({
      // Páginas legais entram com prioridade baixa pra não competir com a landing principal
      // mas explícitas pra Google enxergar a estrutura completa do site (exigência Google Ads).
      serialize(item) {
        const legalPaths = ['/privacidade', '/termos', '/acessibilidade'];
        if (legalPaths.some((path) => item.url.endsWith(path) || item.url.endsWith(path + '/'))) {
          item.priority = 0.3;
          item.changefreq = 'yearly';
        } else {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
