import { describe, expect, it } from 'vitest';
import { bend, contact, crossing, drafting } from './logic';
import { GAMES, loadEngine } from '../registry';

describe('racing rules', () => {
  it('detects crossing even when a frame skips the collision plane', () => {
    expect(crossing(.88, .93)).toBe(true);
    expect(crossing(.91, .94)).toBe(false);
    expect(contact(0, .2)).toBe(true);
    expect(contact(0, .58)).toBe(false);
  });
  it('only drafts behind an aligned rival at a safe distance', () => {
    expect(drafting(0, [{ x: 0, z: .6, passed: false }])).toBe(true);
    expect(drafting(.58, [{ x: 0, z: .6, passed: false }])).toBe(false);
    expect(drafting(0, [{ x: 0, z: .9, passed: false }])).toBe(false);
  });
  it('keeps bends deterministic and rally more demanding', () => {
    expect(bend(1000, 'rally')).toBe(bend(1000, 'rally'));
    expect(Math.abs(bend(1000, 'rally'))).toBeGreaterThan(Math.abs(bend(1000, 'highway')));
  });
  it('registers three unique lazy-loaded racing games with both locales', async () => {
    const games = GAMES.filter((g) => g.category === 'racing');
    expect(games).toHaveLength(3);
    for (const game of games) {
      expect(game.howTo.id.length).toBeGreaterThan(20);
      expect(game.howTo.en.length).toBeGreaterThan(20);
      expect((await loadEngine(game.id)).constructor.name).toBe('RacingEngine');
    }
  });
});
