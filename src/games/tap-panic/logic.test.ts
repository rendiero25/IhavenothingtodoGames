import { describe, expect, it } from 'vitest';
import {
  decoyChance,
  spawnInterval,
  targetHitRadius,
  targetPoints,
  targetTtl,
} from './logic';

describe('kurva kesulitan tap-panic', () => {
  it('interval spawn menurun dengan floor 450', () => {
    expect(spawnInterval(1)).toBe(1100);
    expect(spawnInterval(2)).toBeLessThan(spawnInterval(1));
    expect(spawnInterval(99)).toBe(450);
  });
  it('umur target menurun dengan floor 650', () => {
    expect(targetTtl(1)).toBe(1600);
    expect(targetTtl(99)).toBe(650);
  });
  it('decoy muncul mulai level 4', () => {
    expect(decoyChance(1)).toBe(0);
    expect(decoyChance(3)).toBe(0);
    expect(decoyChance(4)).toBeCloseTo(0.18);
  });
  it('poin lebih besar jika tap lebih cepat', () => {
    expect(targetPoints(1)).toBe(50);
    expect(targetPoints(0)).toBe(20);
    expect(targetPoints(0.5)).toBe(35);
  });
  it.each([
    [320, 266, 399, 39.699],
    [375, 321, 481.5, 32.897],
    [430, 376, 564, 28.085],
  ])(
    'target terkecil tetap punya hit area 44px pada viewport mobile %spx',
    (_viewportWidth, displayWidth, displayHeight, expectedRadius) => {
      expect(targetHitRadius(42 * 0.35, displayWidth, displayHeight)).toBeCloseTo(
        expectedRadius,
        3,
      );
    },
  );
});
