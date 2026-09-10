import { describe, expect, it } from 'vitest';
import { GAMES, getMeta, loadEngine } from './registry';

describe('arena-fps registry', () => {
  it('terdaftar sekali sebagai shooter landscape', () => {
    expect(GAMES.filter((game) => game.id === 'arena-fps')).toHaveLength(1);
    expect(getMeta('arena-fps')).toMatchObject({
      category: 'shooter',
      icon: 'crosshair',
      viewport: 'landscape',
    });
  });

  it('memuat FpsEngine secara lazy untuk arena-fps', async () => {
    const engine = await loadEngine('arena-fps');

    expect(engine.constructor.name).toBe('FpsEngine');
  });
});

describe('stick-man-running registry', () => {
  it('terdaftar sekali sebagai dexterity landscape tanpa menghapus game lain', () => {
    const ids = GAMES.map((game) => game.id);

    expect(ids).toEqual([
      'tap-panic',
      'quick-math',
      'simon',
      'missing-number',
      'word-scramble',
      'bubble-sniper',
      'dodge',
      'beat-tap',
      'arena-fps',
      'stick-man-running',
      'kurir-gabut',
      'highway-rush',
      'apex-rally',
      'slipstream',
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getMeta('stick-man-running')).toMatchObject({
      category: 'dexterity',
      icon: 'move',
      viewport: 'landscape',
    });
  });

  it('memuat StickManRunningEngine melalui loader registry', async () => {
    const engine = await loadEngine('stick-man-running');

    expect(engine.constructor.name).toBe('StickManRunningEngine');
  });
});
