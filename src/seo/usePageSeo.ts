import { useEffect } from 'react';
import type { Locale } from '../i18n/dict';
import { DEFAULT_SITE_URL, canonicalUrl, formatSeoTitle, localizeSeo } from './pages';
import type { SeoPage } from './pages';

const PRIMARY_SEO_LOCALE: Locale = 'id';

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.append(element);
  }
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.append(element);
  }
  element.href = href;
}

function removeHeadElement(selector: string) {
  document.head.querySelector(selector)?.remove();
}

export function usePageSeo(page: SeoPage, locale: Locale) {
  const content = localizeSeo(page, locale);
  const primaryContent = localizeSeo(page, PRIMARY_SEO_LOCALE);

  useEffect(() => {
    // One canonical URL needs one stable public metadata language. The UI can
    // still switch languages, while crawlers always see the Indonesian primary
    // representation until dedicated locale URLs exist.
    const isIndexable = primaryContent.robots === 'index,follow';
    const canonical = isIndexable
      ? canonicalUrl(import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL, primaryContent.path)
        ?? canonicalUrl(window.location.origin, primaryContent.path)
        ?? window.location.href
      : null;
    const title = formatSeoTitle(primaryContent.title);

    document.title = title;
    document.documentElement.lang = locale;
    setMeta('meta[name="description"]', { name: 'description', content: primaryContent.description });
    setMeta('meta[name="robots"]', { name: 'robots', content: primaryContent.robots });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: primaryContent.description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'id_ID' });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: primaryContent.description });
    if (canonical) {
      setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
      setCanonical(canonical);
    } else {
      removeHeadElement('meta[property="og:url"]');
      removeHeadElement('link[rel="canonical"]');
    }
  }, [locale, primaryContent.description, primaryContent.path, primaryContent.robots, primaryContent.title]);

  return content;
}
