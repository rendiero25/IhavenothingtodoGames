import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { BELOW_THE_SURFACE_STOPS } from '../../education/below-the-surface';
import type { EducationVisual } from '../../education/types';
import { ObjectScene, getCategoryToken, getVisualRendererKind } from './ObjectScene';

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    locale: 'en',
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

describe('ObjectScene helpers', () => {
  it('falls back to line-art for unknown visual kinds', () => {
    const visual: EducationVisual = { kind: 'mystery-shape', label: 'Unknown object' };

    expect(getVisualRendererKind(visual)).toBe('line');
  });

  it('returns stable tokens for every category', () => {
    expect(getCategoryToken('life')).toBe('moss');
    expect(getCategoryToken('human')).toBe('signal');
    expect(getCategoryToken('geology')).toBe('strata');
    expect(getCategoryToken('tech')).toBe('circuit');
  });

  it('renders the object label with active scene state', () => {
    const markup = renderToStaticMarkup(
      createElement(ObjectScene, {
        stop: BELOW_THE_SURFACE_STOPS[0],
        active: true,
        reducedMotion: false,
      }),
    );

    expect(markup).toContain(BELOW_THE_SURFACE_STOPS[0].visual.label);
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('data-renderer-kind="surface"');
    expect(markup).toContain('motion-safe:animate-[scene-reveal_560ms_ease-out]');
    expect(markup).toContain('motion-safe:animate-[scene-idle_6s_ease-in-out_infinite]');
    expect(markup).toContain('@keyframes scene-reveal');
    expect(markup).toContain('@keyframes scene-settle');
    expect(markup).toContain('@keyframes scene-idle');
  });

  it('uses the line-art fallback and removes motion classes when reduced', () => {
    const stop = {
      ...BELOW_THE_SURFACE_STOPS[0],
      visual: {
        kind: 'mystery-shape',
        label: 'Unknown object',
      },
    };

    const markup = renderToStaticMarkup(
      createElement(ObjectScene, {
        stop,
        active: false,
        reducedMotion: true,
      }),
    );

    expect(markup).toContain('Unknown object');
    expect(markup).toContain('data-renderer-kind="line"');
    expect(markup).toContain('data-motion="reduced"');
    expect(markup).not.toContain('motion-safe:animate-');
  });
});
