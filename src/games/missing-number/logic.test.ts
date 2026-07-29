import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { makeNumQ, numTimeMs } from './logic';

describe('missing-number', () => {
  it('display punya tepat satu lubang; opsi memuat jawaban tepat sekali dan unik', () => {
    const rand = mulberry32(21);
    for (let i = 0; i < 300; i++) {
      const q = makeNumQ(rand, 1 + (i % 8));
      expect(q.display.filter((v) => v === null).length).toBe(1);
      expect(q.options.length).toBe(3);
      expect(q.options.filter((o) => o === q.answer).length).toBe(1);
      expect(new Set(q.options).size).toBe(3);
    }
  });
  it('deterministik per seed', () => {
    const a = makeNumQ(mulberry32(7), 3);
    const b = makeNumQ(mulberry32(7), 3);
    expect(a).toEqual(b);
  });
  it('waktu menurun dengan floor 3000', () => {
    expect(numTimeMs(1)).toBe(8000);
    expect(numTimeMs(99)).toBe(3000);
  });
});
