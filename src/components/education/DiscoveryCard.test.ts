import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { BELOW_THE_SURFACE_STOPS } from '../../education/below-the-surface';
import type { EducationSource } from '../../education/types';
import { DiscoveryCard, formatSourceLabel } from './DiscoveryCard';

const mockedLocale = vi.hoisted(() => ({ current: 'en' as 'en' | 'id' }));
const translations = {
  en: {
    'education.category.life': 'Life',
    'education.category.human': 'Human',
    'education.category.geology': 'Geology',
    'education.category.tech': 'Technology',
    'education.label.depth': 'Depth',
    'education.label.comparison': 'Comparison',
    'education.label.source': 'Source',
  },
  id: {
    'education.category.life': 'Kehidupan',
    'education.category.human': 'Manusia',
    'education.category.geology': 'Geologi',
    'education.category.tech': 'Teknologi',
    'education.label.depth': 'Kedalaman',
    'education.label.comparison': 'Perbandingan',
    'education.label.source': 'Sumber',
  },
} as const;

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    locale: mockedLocale.current,
    setLocale: vi.fn(),
    t: (key: keyof (typeof translations)['en']) => translations[mockedLocale.current][key],
  }),
}));

describe('DiscoveryCard helpers', () => {
  it('keeps source labels non-empty', () => {
    const emptyLabelSource: EducationSource = {
      label: '   ',
      url: 'https://example.com/source',
    };

    expect(formatSourceLabel(emptyLabelSource).length).toBeGreaterThan(0);
  });

  it('falls back without forcing an English source label', () => {
    const invalidSource: EducationSource = {
      label: ' ',
      url: 'not-a-valid-url',
    };

    expect(formatSourceLabel(invalidSource)).toBe('not-a-valid-url');
  });

  it('renders the locale-aware stop copy and same-tab source link', () => {
    mockedLocale.current = 'en';
    const stop = BELOW_THE_SURFACE_STOPS[4];
    const markup = renderToStaticMarkup(createElement(DiscoveryCard, { stop }));

    expect(markup).toContain(stop.title.en);
    expect(markup).toContain(stop.fact.en);
    expect(markup).toContain(stop.comparison.en);
    expect(markup).toContain('Human');
    expect(markup).toContain(`href="${stop.source.url}"`);
    expect(markup).not.toContain('target="_blank"');
    expect(markup).toContain('focus-visible:outline-ink');
    expect(markup).toContain('Depth 10 m');
    expect(markup).toContain(`Source ${stop.source.label}`);
  });

  it('uses shared dictionary labels for Indonesian locale', () => {
    mockedLocale.current = 'id';
    const stop = BELOW_THE_SURFACE_STOPS[3];
    const markup = renderToStaticMarkup(createElement(DiscoveryCard, { stop }));

    expect(markup).toContain(stop.title.id);
    expect(markup).toContain(stop.fact.id);
    expect(markup).toContain(stop.comparison.id);
    expect(markup).toContain('Teknologi');
    expect(markup).toContain('Kedalaman 1,8 m');
    expect(markup).toContain(`Sumber ${stop.source.label}`);
    expect(markup).toContain('Perbandingan');
  });
});
