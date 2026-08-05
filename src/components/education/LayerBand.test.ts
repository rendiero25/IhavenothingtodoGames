import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getLayerToken, LayerBand } from './LayerBand';

describe('getLayerToken', () => {
  it('maps every valid layer to a non-empty token', () => {
    expect(getLayerToken('surface')).toBeTruthy();
    expect(getLayerToken('soil')).toBeTruthy();
    expect(getLayerToken('groundwater')).toBeTruthy();
    expect(getLayerToken('underground')).toBeTruthy();
    expect(getLayerToken('crust')).toBeTruthy();
    expect(getLayerToken('mantle')).toBeTruthy();
    expect(getLayerToken('core')).toBeTruthy();
  });
});

describe('LayerBand', () => {
  it('renders a semantic strata band with stable layer classes and progress style', () => {
    const markup = renderToStaticMarkup(
      createElement(LayerBand, { layer: 'mantle', active: true, progress: 0.45 }),
    );

    expect(markup).toContain('<section');
    expect(markup).toContain('data-layer="mantle"');
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('layer-mantle');
    expect(markup).toContain('--layer-progress:0.45');
  });

  it('keeps inactive layers explicit in markup', () => {
    const markup = renderToStaticMarkup(
      createElement(LayerBand, { layer: 'surface', active: false, progress: 0 }),
    );

    expect(markup).toContain('data-layer="surface"');
    expect(markup).toContain('data-active="false"');
    expect(markup).toContain('layer-surface');
  });
});
