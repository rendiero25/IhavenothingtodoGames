import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BELOW_THE_SURFACE_STOPS } from '../../education/below-the-surface';
import { I18nProvider } from '../../i18n';
import { DepthJourney } from './DepthJourney';

describe('DepthJourney', () => {
  it('renders one continuous journey image and no live region', () => {
    const markup = renderToStaticMarkup(
      createElement(
        I18nProvider,
        null,
        createElement(DepthJourney, {
          stops: BELOW_THE_SURFACE_STOPS,
          introTitle: 'Below the Surface',
          introDescription: 'A continuous journey through Earth.',
        }),
      ),
    );

    expect(markup).not.toContain('aria-live="polite"');
    expect(markup).toContain('data-journey-count="13"');
    expect(markup.match(/\/education\/earth-journey\.jpg/g)).toHaveLength(1);
    expect(markup).not.toContain('/education/root-zone.png');
    expect(markup).toContain('data-stop-id="root-zone"');
    expect(markup).toContain('data-stop-id="inner-core"');
  });
});
