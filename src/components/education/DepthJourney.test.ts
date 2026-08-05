import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BELOW_THE_SURFACE_STOPS } from '../../education/below-the-surface';
import { I18nProvider } from '../../i18n';
import { DepthJourney } from './DepthJourney';

describe('DepthJourney', () => {
  it('does not expose scroll-driven scene updates as a live region', () => {
    const markup = renderToStaticMarkup(
      createElement(I18nProvider, null, createElement(DepthJourney, { stops: BELOW_THE_SURFACE_STOPS })),
    );

    expect(markup).not.toContain('aria-live="polite"');
  });
});
