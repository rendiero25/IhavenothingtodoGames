import { describe, expect, it } from 'vitest';
import {
  APP_ROUTES,
  INDEXABLE_SEO_PAGES,
  STATIC_SEO_PAGES,
  canonicalUrl,
  formatSeoTitle,
  getGameSeo,
  getSeoPage,
  localizeSeo,
  normalizeSiteUrl,
} from './pages';
import { GAMES } from '../games/registry';
import vercelConfig from '../../vercel.json';

describe('SEO page registry', () => {
  it('has unique canonical paths for every indexable page', () => {
    const paths = INDEXABLE_SEO_PAGES.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('/education/below-the-surface');
    expect(paths).toContain('/play/kurir-gabut');
  });

  it('creates localized, truthful game metadata from the game registry', () => {
    const game = GAMES.find((entry) => entry.id === 'kurir-gabut')!;
    const page = getGameSeo(game);

    expect(localizeSeo(page, 'id').description).toContain(game.tagline.id);
    expect(localizeSeo(page, 'en').description).toContain(game.tagline.en);
    expect(getSeoPage(page.path)).toEqual(page);
  });

  it('indexes Weird after it has real content', () => {
    const weird = getSeoPage('/weird');

    expect(weird.robots).toBe('index,follow');
    expect(INDEXABLE_SEO_PAGES).toContain(weird);
  });

  it('uses a normalized production origin for canonical URLs', () => {
    expect(normalizeSiteUrl('https://example.com/')).toBe('https://example.com');
    expect(canonicalUrl('https://example.com/', '/education')).toBe('https://example.com/education');
    expect(normalizeSiteUrl('https://example.com/not-an-origin')).toBeNull();
    expect(canonicalUrl('notaurl', '/')).toBeNull();
    expect(formatSeoTitle('Mini Game')).toBe('Mini Game | ihavenothingtodo');
  });

  it('keeps app routes and Vercel static rewrites covered by SEO output', () => {
    const publicRoutes = [
      APP_ROUTES.home,
      APP_ROUTES.daily,
      APP_ROUTES.education,
      APP_ROUTES.belowTheSurface,
      APP_ROUTES.aboveTheSurface,
      APP_ROUTES.weird,
    ];
    const staticPaths = STATIC_SEO_PAGES.map((page) => page.path);
    const expectedPaths = [...publicRoutes, ...GAMES.map((game) => `/play/${game.id}`)].sort();

    expect(staticPaths.sort()).toEqual(expectedPaths);

    const rewrites = vercelConfig.rewrites ?? [];
    const rewriteDestinations = Object.fromEntries(
      rewrites.map(({ source, destination }) => [source, destination]),
    );
    const expectedRewrites = expectedPaths
      .filter((path) => path !== APP_ROUTES.home)
      .reduce<Record<string, string>>((routes, path) => {
        routes[path] = `${path}/index.html`;
        return routes;
      }, {});

    expect(rewriteDestinations).toEqual(expectedRewrites);
  });
});
