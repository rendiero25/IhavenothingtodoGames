import { createElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '../../i18n';
import type { Locale } from '../../i18n/dict';
import type { EducationStop } from '../../education/types';
import { DepthRuler, getDepthLabel } from './DepthRuler';

const STOPS: readonly EducationStop[] = [
  {
    id: 'surface-life',
    depthMeters: 0,
    layer: 'surface',
    category: 'life',
    title: { id: 'Permukaan', en: 'Surface' },
    fact: { id: 'Fakta', en: 'Fact' },
    comparison: { id: 'Perbandingan', en: 'Comparison' },
    source: { label: 'Source', url: 'https://example.com/surface' },
    visual: { kind: 'cutaway', label: { id: 'Potongan', en: 'Cutaway' } },
  },
  {
    id: 'root-zone',
    depthMeters: 1500,
    layer: 'soil',
    category: 'life',
    title: { id: 'Zona akar', en: 'Root zone' },
    fact: { id: 'Fakta', en: 'Fact' },
    comparison: { id: 'Perbandingan', en: 'Comparison' },
    source: { label: 'Source', url: 'https://example.com/root-zone' },
    visual: { kind: 'roots', label: { id: 'Akar', en: 'Roots' } },
  },
] as const;

function renderWithLocale(locale: Locale, ui: ReactElement) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { language: locale === 'id' ? 'id-ID' : 'en-US' },
    configurable: true,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: () => locale,
      setItem: () => undefined,
    },
    configurable: true,
  });

  return renderToStaticMarkup(createElement(I18nProvider, null, ui));
}

describe('getDepthLabel', () => {
  it('formats zero, meter, kilometer, and large depths for Indonesian', () => {
    expect(getDepthLabel(0, 'id')).toBe('0 m');
    expect(getDepthLabel(1, 'id')).toBe('1 m');
    expect(getDepthLabel(1500, 'id')).toBe('1,5 km');
    expect(getDepthLabel(12742, 'id')).toBe('12,7 km');
  });

  it('formats zero, meter, kilometer, and large depths for English', () => {
    expect(getDepthLabel(0, 'en')).toBe('0 m');
    expect(getDepthLabel(1, 'en')).toBe('1 m');
    expect(getDepthLabel(1500, 'en')).toBe('1.5 km');
    expect(getDepthLabel(12742, 'en')).toBe('12.7 km');
  });
});

describe('DepthRuler', () => {
  it('renders one semantic marker button per stop and marks the active step', () => {
    const markup = renderWithLocale(
      'en',
      createElement(DepthRuler, {
        stops: STOPS,
        activeStopId: 'root-zone',
        onSelect: () => undefined,
      }),
    );

    expect(markup).toContain('<nav');
    expect(markup.match(/<button/g)?.length).toBe(STOPS.length);
    expect(markup).toContain('aria-current="step"');
    expect(markup).toContain('title="Surface (0 m)"');
    expect(markup).toContain('title="Root zone (1.5 km)"');
    expect(markup).toContain('min-h-11');
  });

  it('keeps the ruler column shrinkable on narrow layouts', () => {
    const markup = renderWithLocale(
      'en',
      createElement(DepthRuler, {
        stops: [
          {
            ...STOPS[0],
            title: {
              id: 'Permukaan dengan judul yang sangat panjang untuk uji mobile',
              en: 'Surface with an intentionally long title for mobile sizing checks',
            },
          },
        ],
        activeStopId: 'surface-life',
      }),
    );

    expect(markup).toContain('w-full min-w-0');
    expect(markup).toContain('[overflow-wrap:anywhere]');
    expect(markup).not.toContain('min-w-max');
    expect(markup).not.toContain('min-w-40');
  });

  it('uses theme-safe ink and paper tokens for marker contrast', () => {
    const markup = renderWithLocale(
      'en',
      createElement(DepthRuler, { stops: STOPS, activeStopId: 'surface-life' }),
    );

    expect(markup).toContain('border-ink');
    expect(markup).toContain('bg-paper');
    expect(markup).toContain('text-ink');
    expect(markup).toContain('border-ink bg-ink text-paper');
    expect(markup).not.toContain('white');
  });

  it('uses localized titles and depth labels', () => {
    const markup = renderWithLocale(
      'id',
      createElement(DepthRuler, { stops: STOPS, activeStopId: 'surface-life' }),
    );

    expect(markup).toContain('title="Permukaan (0 m)"');
    expect(markup).toContain('title="Zona akar (1,5 km)"');
    expect(markup).toContain('aria-current="step"');
  });
});
