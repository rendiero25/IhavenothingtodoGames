import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { bpmForLevel, judge, makeBar } from './logic';
describe('beat-tap', () => {
  it('bpm naik per level, maksimum 180', () => { expect(bpmForLevel(1)).toBe(90); expect(bpmForLevel(2)).toBe(98); expect(bpmForLevel(99)).toBe(180); });
  it('bar punya 8 slot, slot 0 selalu berisi, kepadatan sesuai level', () => { const rand = mulberry32(6); for (const level of [1, 3, 6, 10]) { const bar = makeBar(rand, level); expect(bar.length).toBe(8); expect(bar[0]).toBe(true); expect(bar.filter(Boolean).length).toBe(Math.min(6, 2 + level)); } });
  it('judge: perfect <=50ms, good <=130ms, selain itu null', () => { expect(judge(0)).toBe('perfect'); expect(judge(-50)).toBe('perfect'); expect(judge(80)).toBe('good'); expect(judge(-130)).toBe('good'); expect(judge(131)).toBeNull(); });
});
