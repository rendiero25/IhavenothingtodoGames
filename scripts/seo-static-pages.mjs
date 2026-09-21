import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const SEO_HEAD_START = '<!-- seo-head:start -->';
const SEO_HEAD_END = '<!-- seo-head:end -->';
const APP_ROOT_START = '<!-- app-root:start -->';
const APP_ROOT_END = '<!-- app-root:end -->';

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]);
}

function replaceMarkedSection(html, start, end, content) {
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Missing SEO marker: ${start}`);
  return `${html.slice(0, startIndex + start.length)}\n${content}\n${html.slice(endIndex)}`;
}

function canonicalUrl(siteUrl, path) {
  return path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`;
}

function renderHead(page, siteUrl) {
  const title = `${page.title} | ihavenothingtodo`;
  const canonical = siteUrl ? canonicalUrl(siteUrl, page.path) : null;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<meta name="robots" content="${page.robots}" />`,
    '<meta name="application-name" content="ihavenothingtodo" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="ihavenothingtodo" />',
    '<meta property="og:locale" content="id_ID" />',
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
  ];
  if (canonical && page.robots === 'index,follow') {
    tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`);
    tags.push(`<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  }
  return tags.join('\n    ');
}

function renderFallback(page) {
  return [
    '<div id="root">',
    '  <main>',
    `    <h1>${escapeHtml(page.heading)}</h1>`,
    `    <p>${escapeHtml(page.description)}</p>`,
    '  </main>',
    '</div>',
  ].join('\n');
}

function renderPage(template, page, siteUrl) {
  const withHead = replaceMarkedSection(template, SEO_HEAD_START, SEO_HEAD_END, renderHead(page, siteUrl));
  return replaceMarkedSection(withHead, APP_ROOT_START, APP_ROOT_END, renderFallback(page));
}

function outputPath(outDir, path) {
  if (path === '/') return join(outDir, 'index.html');
  return join(outDir, ...path.split('/').filter(Boolean), 'index.html');
}

function renderSitemap(siteUrl, pages) {
  const urls = pages
    .filter((page) => page.robots === 'index,follow')
    .map((page) => canonicalUrl(siteUrl, page.path));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

export default function seoStaticPages({ siteUrl, pages, notFound }) {
  let outDir = '';
  return {
    name: 'seo-static-pages',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const template = await readFile(join(outDir, 'index.html'), 'utf8');
      await Promise.all(pages.map(async (page) => {
        const destination = outputPath(outDir, page.path);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, renderPage(template, page, siteUrl), 'utf8');
      }));

      await writeFile(join(outDir, '404.html'), renderPage(template, notFound, null), 'utf8');

      const sitemap = siteUrl ? `Sitemap: ${canonicalUrl(siteUrl, '/sitemap.xml')}\n` : '';
      await writeFile(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n${sitemap}`, 'utf8');
      if (siteUrl) {
        await writeFile(join(outDir, 'sitemap.xml'), renderSitemap(siteUrl, pages), 'utf8');
      } else {
        console.warn('[seo] sitemap omitted: set VITE_SITE_URL to the final production origin.');
      }
    },
  };
}
