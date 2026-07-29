import { describe, expect, it } from 'vitest';
import {
  dailyLineup,
  dailyRunSnapshot,
  dailySeed,
  msUntilNextLocalDay,
  stageSeed,
  todayKey,
} from './daily';

const IDS = [
  'tap-panic',
  'bubble-sniper',
  'simon',
  'missing-number',
  'word-scramble',
  'quick-math',
  'dodge',
  'beat-tap',
] as const;

describe('daily', () => {
  it('todayKey format YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 6, 9))).toBe('2026-07-09');
    expect(todayKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('lineup: 5 game unik dari daftar, deterministik per tanggal', () => {
    const a = dailyLineup('2026-07-09', IDS);
    const b = dailyLineup('2026-07-09', IDS);
    expect(a).toEqual(b);
    expect(a.length).toBe(5);
    expect(new Set(a).size).toBe(5);
    for (const id of a) expect(IDS).toContain(id);
  });

  it('tanggal beda memberi seed beda', () => {
    expect(dailySeed('2026-07-09')).not.toBe(dailySeed('2026-07-10'));
  });

  it('stageSeed beda per index dan per tanggal', () => {
    expect(stageSeed('2026-07-09', 0)).not.toBe(stageSeed('2026-07-09', 1));
    expect(stageSeed('2026-07-09', 0)).not.toBe(stageSeed('2026-07-10', 0));
    expect(stageSeed('2026-07-09', 2)).toBe(stageSeed('2026-07-09', 2));
  });

  it('snapshot run mengunci tanggal dan lineup', () => {
    const run = dailyRunSnapshot('2026-07-09', IDS);
    expect(run.dateKey).toBe('2026-07-09');
    expect(run.lineup).toEqual(dailyLineup('2026-07-09', IDS));
    expect(Object.isFrozen(run)).toBe(true);
    expect(Object.isFrozen(run.lineup)).toBe(true);
  });

  it('menghitung rollover ke tengah malam lokal berikutnya', () => {
    expect(msUntilNextLocalDay(new Date(2026, 6, 9, 23, 59, 59, 500))).toBe(500);
    expect(msUntilNextLocalDay(new Date(2026, 11, 31, 23, 59, 59, 999))).toBe(1);
  });
});
