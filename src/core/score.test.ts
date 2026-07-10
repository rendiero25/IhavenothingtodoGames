import { describe, expect, it } from 'vitest';
import { comboMultiplier, formatDuration, titleKeyFor } from './score';

describe('comboMultiplier', () => {
  it('naik tiap 5 combo, maksimum x5', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(4)).toBe(1);
    expect(comboMultiplier(5)).toBe(2);
    expect(comboMultiplier(9)).toBe(2);
    expect(comboMultiplier(10)).toBe(3);
    expect(comboMultiplier(15)).toBe(4);
    expect(comboMultiplier(20)).toBe(5);
    expect(comboMultiplier(999)).toBe(5);
  });
});

describe('titleKeyFor', () => {
  it('threshold tier benar', () => {
    expect(titleKeyFor(0)).toBe('title.t0');
    expect(titleKeyFor(499)).toBe('title.t0');
    expect(titleKeyFor(500)).toBe('title.t1');
    expect(titleKeyFor(1499)).toBe('title.t1');
    expect(titleKeyFor(1500)).toBe('title.t2');
    expect(titleKeyFor(3999)).toBe('title.t2');
    expect(titleKeyFor(4000)).toBe('title.t3');
    expect(titleKeyFor(8000)).toBe('title.t4');
  });
});

describe('formatDuration', () => {
  it('format m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(61_000)).toBe('1:01');
    expect(formatDuration(154_499)).toBe('2:34');
  });
});
