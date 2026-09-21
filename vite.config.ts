import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import seoStaticPages from './scripts/seo-static-pages.mjs';
import {
  STATIC_SEO_PAGES,
  DEFAULT_SITE_URL,
  getNoIndexSeoPage,
  localizeSeo,
  normalizeSiteUrl,
} from './src/seo/pages';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const configuredSiteUrl = processEnv?.VITE_SITE_URL ?? env.VITE_SITE_URL ?? DEFAULT_SITE_URL;
  const siteUrl = normalizeSiteUrl(configuredSiteUrl);
  if (configuredSiteUrl && !siteUrl) {
    throw new Error('VITE_SITE_URL must be an absolute HTTP(S) production URL.');
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
      seoStaticPages({
        siteUrl,
        pages: STATIC_SEO_PAGES.map((page) => localizeSeo(page, 'id')),
        notFound: localizeSeo(getNoIndexSeoPage('/', 'notFound'), 'id'),
      }),
    ],
    test: { include: ['src/**/*.test.ts'], environment: 'node' },
  };
});
