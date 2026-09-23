import { describe, expect, it } from 'vitest';
import { createState, GROUND, step } from './logic';

const idle = { left: false, right: false, jump: false, interact: false };
describe('Veilwalk', () => {
  it('bergerak dan melompat', () => {
    const s = createState(5);
    step(s, { ...idle, right: true, jump: true }, 1 / 60);
    expect(s.x).toBeGreaterThan(90);
    expect(s.y).toBeLessThan(GROUND);
  });
  it('jurang memakan nyawa dan respawn di checkpoint', () => {
    const s = createState(3); s.x = 805; s.y = 620; s.grounded = false;
    step(s, idle, 1 / 60);
    expect(s.lives).toBe(2); expect(s.x).toBe(90);
  });
  it('tuas membuka jembatan', () => {
    const s = createState(3); s.x = 2080;
    step(s, { ...idle, interact: true }, 1 / 60);
    expect(s.bridge).toBe(true);
    s.x = 2300; s.y = GROUND - 1; s.vy = 50;
    step(s, idle, 1 / 60);
    expect(s.grounded).toBe(true);
  });
  it('gerbang mengakhiri permainan', () => {
    const s = createState(3); s.x = 3741;
    step(s, idle, 1 / 60);
    expect(s.finished).toBe(true);
  });
  it('seluruh jalur bisa diselesaikan tanpa kehilangan nyawa', () => {
    const s = createState(5);
    const jumps = [690, 1120, 1430, 1750, 2770, 3000, 3320];
    let next = 0;
    for (let i = 0; i < 1200 && !s.finished && !s.dead; i++) {
      const jump = s.grounded && next < jumps.length && s.x >= jumps[next];
      if (jump) next++;
      step(s, { ...idle, right: true, jump, interact: s.x > 2040 && s.x < 2110 }, 1 / 60);
    }
    expect(s.finished).toBe(true);
    expect(s.lives).toBe(5);
    expect(s.bridge).toBe(true);
  });
});
