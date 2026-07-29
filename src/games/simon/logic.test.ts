import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { extendSequence, playbackMs } from './logic';

describe('simon', () => {
  it('extend menambah tepat satu pad 0-3 tanpa mengubah prefix', () => {
    const rand = mulberry32(4);
    let seq: number[] = [];
    for (let i = 0; i < 30; i++) {
      const next = extendSequence(seq, rand);
      expect(next.length).toBe(seq.length + 1);
      expect(next.slice(0, seq.length)).toEqual(seq);
      expect(next[next.length - 1]).toBeGreaterThanOrEqual(0);
      expect(next[next.length - 1]).toBeLessThanOrEqual(3);
      seq = next;
    }
  });
  it('tempo playback menurun dengan floor 260', () => {
    expect(playbackMs(1)).toBe(650);
    expect(playbackMs(5)).toBeLessThan(650);
    expect(playbackMs(99)).toBe(260);
  });
});
