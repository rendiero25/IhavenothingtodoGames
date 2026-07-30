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
