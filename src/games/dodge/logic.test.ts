import { describe, expect, it } from 'vitest';
import { circleRectOverlap, fallSpeed, spawnMs } from './logic';
describe('dodge', () => {
  it('kecepatan jatuh naik, spawn menurun dengan floor 320', () => { expect(fallSpeed(1)).toBe(160); expect(fallSpeed(5)).toBeGreaterThan(fallSpeed(1)); expect(spawnMs(1)).toBe(800); expect(spawnMs(99)).toBe(320); });
  it('deteksi tabrakan lingkaran-persegi', () => {
    const rect = { x: 100, y: 100, w: 60, h: 20 };
    expect(circleRectOverlap(130, 110, 10, rect)).toBe(true);
    expect(circleRectOverlap(90, 95, 12, rect)).toBe(true);
    expect(circleRectOverlap(130, 200, 10, rect)).toBe(false);
    expect(circleRectOverlap(50, 50, 10, rect)).toBe(false);
  });
});
