import { defineMiddleware } from 'astro:middleware';

const ALLOWED_COUNTRY = 'BR';

// Páginas que nunca bloqueiam (legal, health checks)
const BYPASS_PATHS = ['/bloqueado', '/favicon.ico', '/robots.txt', '/site.webmanifest'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Deixa passar rotas de bypass
  if (BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
    return next();
  }

  // Vercel injeta o país do IP neste header
  const country = context.request.headers.get('x-vercel-ip-country');

  // Em desenvolvimento (country = null) ou Brasil: libera
  if (!country || country === ALLOWED_COUNTRY) {
    return next();
  }

  // Fora do Brasil: redireciona para /bloqueado
  return context.redirect('/bloqueado', 302);
});
