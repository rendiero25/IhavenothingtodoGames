import { describe, expect, it } from 'vitest';
import { ascentPosition, ATMOSPHERE_STOPS } from './atmosphere';
import { dictionaries } from '../i18n/dict';

describe('atmosphere journey', () => {
  it('distinguishes the five atmospheric layers from the surface and space', () => {
    expect(ATMOSPHERE_STOPS.filter(stop => stop.layer > 0).map(stop => stop.id)).toEqual([
      'troposphere', 'stratosphere', 'mesosphere', 'thermosphere', 'exosphere',
    ]);
    expect(ATMOSPHERE_STOPS[0].altitude).toBe(0);
    expect(ATMOSPHERE_STOPS.at(-1)?.id).toBe('beyond');
  });
  it('moves toward higher chapters as native scrollTop decreases', () => {
    const centers = [4500, 3500, 2500, 1500, 500];
    expect(ascentPosition(4000, 1000, centers)).toBe(0);
    expect(ascentPosition(3000, 1000, centers)).toBe(1);
    expect(ascentPosition(0, 1000, centers)).toBe(4);
    expect(ascentPosition(2800, 600, centers)).toBe(1);
  });
  it('provides complete chapter content in both languages', () => {
    for (const dictionary of Object.values(dictionaries)) {
      for (const stop of ATMOSPHERE_STOPS) {
        for (const field of ['name', 'title', 'body', 'fact', 'object'] as const) {
          expect(dictionary[`sky.${stop.id}.${field}`].trim()).not.toBe('');
        }
      }
    }
  });
});
