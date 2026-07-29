import { describe, expect, it } from 'vitest';
import {
  bubbleHitRadius,
  bubbleRadius,
  bubbleSpeed,
  hitPoints,
  skullChance,
  spawnMs,
} from './logic';
describe('kurva bubble-sniper', () => {
  it('kecepatan naik per level', () => { expect(bubbleSpeed(1)).toBe(90); expect(bubbleSpeed(5)).toBeGreaterThan(bubbleSpeed(1)); });
  it('spawn menurun dengan floor 600', () => { expect(spawnMs(1)).toBe(1400); expect(spawnMs(99)).toBe(600); });
  it('radius mengecil dengan floor 16', () => { expect(bubbleRadius(1)).toBe(26); expect(bubbleRadius(99)).toBe(16); });
  it('skull muncul mulai level 3', () => { expect(skullChance(2)).toBe(0); expect(skullChance(3)).toBeCloseTo(0.2); });
  it('poin naik per level', () => { expect(hitPoints(1)).toBe(18); expect(hitPoints(5)).toBe(30); });
  it.each([
    [320, 266, 399, 39.699],
    [375, 321, 481.5, 32.897],
    [430, 376, 564, 28.085],
  ])(
    'bubble terkecil tetap punya hit area 44px pada viewport mobile %spx',
    (_viewportWidth, displayWidth, displayHeight, expectedRadius) => {
      expect(bubbleHitRadius(16, displayWidth, displayHeight)).toBeCloseTo(
        expectedRadius,
        3,
      );
    },
  );
});
