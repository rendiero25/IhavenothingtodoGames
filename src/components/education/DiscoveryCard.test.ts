import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { BELOW_THE_SURFACE_STOPS } from '../../education/below-the-surface';
import type { EducationSource } from '../../education/types';
import { DiscoveryCard, formatSourceLabel } from './DiscoveryCard';

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    locale: 'en',
    setLocale: vi.fn(),
    t: (key: string) => key,
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

  it('renders the locale-aware stop copy and same-tab source link', () => {
    const stop = BELOW_THE_SURFACE_STOPS[4];
    const markup = renderToStaticMarkup(createElement(DiscoveryCard, { stop }));

    expect(markup).toContain(stop.title.en);
    expect(markup).toContain(stop.fact.en);
    expect(markup).toContain(stop.comparison.en);
    expect(markup).toContain(`href="${stop.source.url}"`);
    expect(markup).not.toContain('target="_blank"');
    expect(markup).toContain('focus-visible:outline-ink');
    expect(markup).toContain('Depth 10 m');
    expect(markup).toContain(`Source ${stop.source.label}`);
  });
});
