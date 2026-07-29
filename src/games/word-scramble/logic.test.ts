import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { pickWord, scramble, wordLenForLevel, wordTimeMs } from './logic';
import { WORDS_ID } from './words-id';
import { WORDS_EN } from './words-en';

describe('kamus kata', () => {
  for (const [label, list] of [['id', WORDS_ID], ['en', WORDS_EN]] as const) {
    it(`${label}: lowercase, 4-7 huruf, unik`, () => {
      expect(new Set(list).size).toBe(list.length);
      for (const w of list) {
        expect(w).toBe(w.toLowerCase());
        expect(w.length).toBeGreaterThanOrEqual(4);
        expect(w.length).toBeLessThanOrEqual(7);
      }
      for (const len of [4, 5, 6, 7]) {
        expect(list.filter((w) => w.length === len).length).toBeGreaterThanOrEqual(8);
      }
    });
  }
});

describe('logic kata-acak', () => {
  it('panjang kata naik dengan level, maksimum 7', () => {
    expect(wordLenForLevel(1)).toBe(4);
    expect(wordLenForLevel(3)).toBe(5);
    expect(wordLenForLevel(5)).toBe(6);
    expect(wordLenForLevel(7)).toBe(7);
    expect(wordLenForLevel(99)).toBe(7);
  });
  it('pickWord menghormati panjang bila tersedia', () => {
    const rand = mulberry32(3);
    for (let i = 0; i < 50; i += 1) expect(pickWord(rand, WORDS_ID, 5).length).toBe(5);
  });
  it('scramble = permutasi dan berbeda dari kata asal', () => {
    const rand = mulberry32(9);
    for (const w of ['makan', 'bintang', 'rocket', 'kopi']) {
      const s = scramble(rand, w);
      expect([...s].sort().join('')).toBe([...w].sort().join(''));
      expect(s.join('')).not.toBe(w);
    }
  });
  it('waktu per kata menurun dengan floor 4000', () => {
    expect(wordTimeMs(1)).toBe(9000);
    expect(wordTimeMs(99)).toBe(4000);
  });
});
