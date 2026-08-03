import { describe, expect, it } from 'vitest';
import { createWave } from './waves';

describe('arena FPS waves', () => {
  it('deterministik dan dibatasi 12 musuh', () => {
    expect(createWave(77, 8)).toEqual(createWave(77, 8));
    expect(createWave(77, 99)).toHaveLength(12);
  });

  it('membuat boss setiap lima wave', () => {
    expect(createWave(77, 4).some((enemy) => enemy.boss)).toBe(false);
    expect(createWave(77, 5).filter((enemy) => enemy.boss)).toHaveLength(1);
  });
});
