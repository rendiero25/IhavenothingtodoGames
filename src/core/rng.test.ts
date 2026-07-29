import { describe, expect, it } from 'vitest';
import { hashString, mulberry32, pick, randInt, seededShuffle } from './rng';

describe('hashString', () => {
  it('deterministik dan berbeda antar input', () => {
    expect(hashString('2026-07-09')).toBe(hashString('2026-07-09'));
    expect(hashString('2026-07-09')).not.toBe(hashString('2026-07-10'));
  });
  it('menghasilkan uint32', () => {
    const h = hashString('ihavenothingtodo');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });
});

describe('mulberry32', () => {
  it('seed sama menghasilkan urutan sama', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });
  it('seed beda menghasilkan urutan beda', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
  it('nilai selalu di [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('seededShuffle', () => {
  const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  it('permutasi lengkap tanpa mutasi input', () => {
    const out = seededShuffle(arr, mulberry32(3));
    expect([...out].sort()).toEqual([...arr].sort());
    expect(arr[0]).toBe('a');
  });
  it('deterministik per seed', () => {
    expect(seededShuffle(arr, mulberry32(9))).toEqual(seededShuffle(arr, mulberry32(9)));
  });
});

describe('randInt & pick', () => {
  it('randInt inklusif dalam rentang', () => {
    const r = mulberry32(5);
    for (let i = 0; i < 500; i++) {
      const v = randInt(r, 2, 6);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
  it('pick mengambil elemen dari array', () => {
    const r = mulberry32(5);
    for (let i = 0; i < 100; i++) expect(['x', 'y', 'z']).toContain(pick(r, ['x', 'y', 'z']));
  });
});
