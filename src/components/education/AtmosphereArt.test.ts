import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ATMOSPHERE_STOPS } from '../../education/atmosphere';
import { AtmosphereArt } from './AtmosphereArt';

const artwork = () => ATMOSPHERE_STOPS.map(({ id }) => renderToStaticMarkup(createElement(AtmosphereArt, { scene: id }))).join('');

describe('atmosphere vector assets', () => {
  it('resolves every gradient, pattern and clip reference without duplicate ids', () => {
    const markup = artwork();
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const match of markup.matchAll(/url\(#([^)]+)\)/g)) {
      expect(ids, `Missing SVG resource: ${match[1]}`).toContain(match[1]);
    }
  });

  it('keeps the entire journey inside a lightweight vector budget', () => {
    const markup = artwork();
    expect(markup.length).toBeLessThan(120_000);
    expect([...markup.matchAll(/<(path|circle|rect|ellipse|g)\b/g)].length).toBeLessThan(1_000);
    expect(markup).not.toMatch(/<(image|filter|foreignObject)\b/);
    expect(markup).not.toMatch(/https?:\/\//);
  });
});
