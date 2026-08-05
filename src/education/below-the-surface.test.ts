import { describe, expect, it } from 'vitest';
import { BELOW_THE_SURFACE_STOPS, validateEducationStops } from './below-the-surface';
import type { EducationStop } from './types';

describe('below the surface education dataset', () => {
  it('provides an ordered, valid dataset with the required coverage', () => {
    expect(BELOW_THE_SURFACE_STOPS.length).toBeGreaterThanOrEqual(12);
    expect(validateEducationStops(BELOW_THE_SURFACE_STOPS)).toEqual([]);
    expect(new Set(BELOW_THE_SURFACE_STOPS.map((stop) => stop.category))).toEqual(
      new Set(['life', 'human', 'geology', 'tech']),
    );

    const depths = BELOW_THE_SURFACE_STOPS.map((stop) => stop.depthMeters);
    const ids = BELOW_THE_SURFACE_STOPS.map((stop) => stop.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(depths).toEqual([...depths].sort((left, right) => left - right));

    for (const stop of BELOW_THE_SURFACE_STOPS) {
      expect(stop.title.id.trim().length).toBeGreaterThan(0);
      expect(stop.title.en.trim().length).toBeGreaterThan(0);
      expect(stop.fact.id.trim().length).toBeGreaterThan(0);
      expect(stop.fact.en.trim().length).toBeGreaterThan(0);
      expect(stop.comparison.id.trim().length).toBeGreaterThan(0);
      expect(stop.comparison.en.trim().length).toBeGreaterThan(0);
      expect(stop.source.url).toMatch(/^https:\/\//);
      expect(stop.visual.label.id.trim().length).toBeGreaterThan(0);
      expect(stop.visual.label.en.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('validateEducationStops', () => {
  it('reports readable issues for invalid entries', () => {
    const invalidStops = [
      {
        id: 'surface-life',
        depthMeters: 0,
        layer: 'surface',
        category: 'life',
        title: { id: '', en: 'Surface life' },
        fact: { id: 'Fakta', en: '' },
        comparison: { id: 'Perbandingan', en: 'Comparison' },
        source: { label: 'Source', url: 'http://example.com' },
        visual: { kind: '', label: { id: '', en: '' } },
      },
      {
        id: 'surface-life',
        depthMeters: 0,
        layer: 'sky',
        category: 'mystery',
        title: { id: 'Lapisan', en: 'Layer' },
        fact: { id: 'Fakta', en: 'Fact' },
        comparison: { id: 'Perbandingan', en: 'Comparison' },
        source: { label: 'Source', url: 'https://example.com' },
        visual: { kind: 'marker', label: { id: 'Marker', en: 'Marker' } },
      },
    ] as unknown as readonly EducationStop[];

    expect(validateEducationStops(invalidStops)).toEqual([
      'Stop "surface-life" must have a depth greater than 0 meters.',
      'Stop "surface-life" is missing title.id copy.',
      'Stop "surface-life" is missing fact.en copy.',
      'Stop "surface-life" source.url must start with https://.',
      'Stop "surface-life" is missing visual.kind.',
      'Stop "surface-life" is missing visual.label.id copy.',
      'Stop "surface-life" is missing visual.label.en copy.',
      'Stop "surface-life" has a duplicate id.',
      'Stop "surface-life" must have a depth greater than 0 meters.',
      'Stop "surface-life" must be deeper than the previous stop.',
      'Stop "surface-life" has an invalid layer "sky".',
      'Stop "surface-life" has an invalid category "mystery".',
    ]);
  });
});
