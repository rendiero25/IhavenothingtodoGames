import { GAMES } from '../games/registry';
import type { GameMeta } from '../games/types';
import type { Locale } from '../i18n/dict';
import { seoCopy } from './copy';

export type SeoRobots = 'index,follow' | 'noindex,follow';

export interface SeoPage {
  path: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  heading: Record<Locale, string>;
  robots: SeoRobots;
}

export interface LocalizedSeoPage {
  path: string;
  title: string;
  description: string;
  heading: string;
  robots: SeoRobots;
}

const SITE_NAME = 'ihavenothingtodo';
export const DEFAULT_SITE_URL = 'https://ihavenothingtodo.xyz';

// App and static-output routes share this registry so a route cannot silently
// lose its crawlable HTML when the Vercel catch-all rewrite is absent.
export const APP_ROUTES = {
  home: '/',
  play: '/play/:gameId',
  daily: '/daily',
  education: '/education',
  belowTheSurface: '/education/below-the-surface',
  aboveTheSurface: '/education/above-the-surface',
  weird: '/weird',
} as const;

function copy(key: keyof typeof seoCopy.id): Record<Locale, string> {
  return { id: seoCopy.id[key], en: seoCopy.en[key] };
}

function page(
  path: string,
  titleKey: keyof typeof seoCopy.id,
  descriptionKey: keyof typeof seoCopy.id,
  headingKey: keyof typeof seoCopy.id,
): SeoPage {
  return {
    path,
    title: copy(titleKey),
    description: copy(descriptionKey),
    heading: copy(headingKey),
    robots: 'index,follow',
  };
}

const CORE_SEO_PAGES = [
  page(APP_ROUTES.home, 'seo.home.title', 'seo.home.description', 'seo.home.heading'),
  page(APP_ROUTES.daily, 'seo.daily.title', 'seo.daily.description', 'seo.daily.heading'),
  page(APP_ROUTES.education, 'seo.education.title', 'seo.education.description', 'seo.education.heading'),
  page(APP_ROUTES.belowTheSurface, 'seo.below.title', 'seo.below.description', 'seo.below.heading'),
  page(APP_ROUTES.aboveTheSurface, 'seo.above.title', 'seo.above.description', 'seo.above.heading'),
  page(APP_ROUTES.weird, 'seo.weird.title', 'seo.weird.description', 'seo.weird.heading'),
] as const;

export function getGameSeo(game: GameMeta): SeoPage {
  return {
    path: APP_ROUTES.play.replace(':gameId', game.id),
    title: {
      id: `${game.name.id} — ${seoCopy.id['seo.game.titleSuffix']}`,
      en: `${game.name.en} — ${seoCopy.en['seo.game.titleSuffix']}`,
    },
    description: {
      id: `${seoCopy.id['seo.game.descriptionPrefix']} ${game.name.id}. ${game.tagline.id} ${seoCopy.id['seo.game.descriptionSuffix']}`,
      en: `${seoCopy.en['seo.game.descriptionPrefix']} ${game.name.en}. ${game.tagline.en} ${seoCopy.en['seo.game.descriptionSuffix']}`,
    },
    heading: {
      id: `${game.name.id}: ${seoCopy.id['seo.game.headingSuffix']}`,
      en: `${game.name.en}: ${seoCopy.en['seo.game.headingSuffix']}`,
    },
    robots: 'index,follow',
  };
}

export const INDEXABLE_SEO_PAGES: readonly SeoPage[] = [
  ...CORE_SEO_PAGES,
  ...GAMES.map(getGameSeo),
];

export const STATIC_SEO_PAGES: readonly SeoPage[] = INDEXABLE_SEO_PAGES;

export function getSeoPage(path: string): SeoPage {
  const pageForPath = INDEXABLE_SEO_PAGES.find((entry) => entry.path === path);
  if (!pageForPath) throw new Error(`No SEO page configured for ${path}.`);
  return pageForPath;
}

export function getNoIndexSeoPage(path: string, kind: 'notFound' | 'placeholder'): SeoPage {
  const titleKey = kind === 'notFound' ? 'seo.notFound.title' : 'seo.placeholder.title';
  const descriptionKey = kind === 'notFound' ? 'seo.notFound.description' : 'seo.placeholder.description';
  return {
    path,
    title: copy(titleKey),
    description: copy(descriptionKey),
    heading: copy(titleKey),
    robots: 'noindex,follow',
  };
}

export function localizeSeo(pageToLocalize: SeoPage, locale: Locale): LocalizedSeoPage {
  return {
    path: pageToLocalize.path,
    title: pageToLocalize.title[locale],
    description: pageToLocalize.description[locale],
    heading: pageToLocalize.heading[locale],
    robots: pageToLocalize.robots,
  };
}

export function formatSeoTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

export function normalizeSiteUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:')
      || url.pathname !== '/'
      || url.search
      || url.hash
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function canonicalUrl(siteUrl: string | undefined, path: string): string | null {
  const base = normalizeSiteUrl(siteUrl);
  if (!base) return null;
  return path === '/' ? `${base}/` : `${base}${path}`;
}
