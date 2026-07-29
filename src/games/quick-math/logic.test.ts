import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { makeQuestion, questionTimeMs } from './logic';

describe('quick-math', () => {
  it('flag truth konsisten dengan aritmetika sebenarnya', () => {
    const rand = mulberry32(11);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion(rand, 1 + (i % 8));
      const real = q.op === '+' ? q.a + q.b : q.op === '-' ? q.a - q.b : q.a * q.b;
      expect(q.truth).toBe(q.shown === real);
    }
  });
  it('pengurangan tidak pernah negatif', () => {
    const rand = mulberry32(12);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion(rand, 5);
      if (q.op === '-') expect(q.a - q.b).toBeGreaterThanOrEqual(0);
    }
  });
  it('level rendah hanya penjumlahan', () => {
    const rand = mulberry32(13);
    for (let i = 0; i < 100; i++) expect(makeQuestion(rand, 1).op).toBe('+');
  });
  it('waktu per soal menurun dengan floor 1800', () => {
    expect(questionTimeMs(1)).toBe(5000);
    expect(questionTimeMs(2)).toBeLessThan(5000);
    expect(questionTimeMs(99)).toBe(1800);
  });
});
