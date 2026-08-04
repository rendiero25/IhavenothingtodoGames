import { describe, expect, it } from 'vitest';
import { dictionaries } from './dict';

describe('kelengkapan i18n', () => {
  it('ID dan EN punya set key identik', () => {
    const idKeys = Object.keys(dictionaries.id).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(enKeys).toEqual(idKeys);
  });
  it('tidak ada string kosong', () => {
    for (const locale of ['id', 'en'] as const) {
      for (const [k, v] of Object.entries(dictionaries[locale])) {
        expect(v.trim(), `${locale}:${k}`).not.toBe('');
      }
    }
  });

  it('memiliki CTA Ko-fi yang konsisten', () => {
    expect(dictionaries.id['home.kofi']).toBe('Buy me a Coffee');
    expect(dictionaries.en['home.kofi']).toBe('Buy me a Coffee');
  });
});
