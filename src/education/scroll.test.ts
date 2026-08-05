import { describe, expect, it } from 'vitest';
import { clampProgress, getActiveStopId, getStopProgress, type EducationScrollEntry } from './scroll';

describe('clampProgress', () => {
  it('clamps values below zero, inside range, and above one', () => {
    expect(clampProgress(-0.25)).toBe(0);
    expect(clampProgress(0.4)).toBe(0.4);
    expect(clampProgress(1.75)).toBe(1);
  });
});

describe('getStopProgress', () => {
  it('returns zero for zero and negative heights', () => {
    expect(getStopProgress(100, 0, 400)).toBe(0);
    expect(getStopProgress(100, -20, 400)).toBe(0);
  });

  it('reports progress before, during, and after a stop', () => {
    expect(getStopProgress(400, 100, 400)).toBe(0);
    expect(getStopProgress(150, 100, 400)).toBe(0.5);
    expect(getStopProgress(-100, 100, 400)).toBe(1);
  });
});

describe('getActiveStopId', () => {
  it('returns the closest center match and null for empty input', () => {
    const entries: readonly EducationScrollEntry[] = [
      { id: 'surface', depthMeters: 0.2, layer: 'surface', category: 'life', title: { id: 'A', en: 'A' }, fact: { id: 'A', en: 'A' }, comparison: { id: 'A', en: 'A' }, source: { label: 'A', url: 'https://example.com/a' }, visual: { kind: 'marker', label: 'A' }, top: 0, height: 100 },
      { id: 'soil', depthMeters: 0.5, layer: 'soil', category: 'life', title: { id: 'B', en: 'B' }, fact: { id: 'B', en: 'B' }, comparison: { id: 'B', en: 'B' }, source: { label: 'B', url: 'https://example.com/b' }, visual: { kind: 'marker', label: 'B' }, top: 150, height: 80 },
      { id: 'core', depthMeters: 5150000, layer: 'core', category: 'geology', title: { id: 'C', en: 'C' }, fact: { id: 'C', en: 'C' }, comparison: { id: 'C', en: 'C' }, source: { label: 'C', url: 'https://example.com/c' }, visual: { kind: 'marker', label: 'C' }, top: 240, height: 60 },
    ];

    expect(getActiveStopId(entries, 140)).toBe('soil');
    expect(getActiveStopId([], 140)).toBeNull();
  });
});
