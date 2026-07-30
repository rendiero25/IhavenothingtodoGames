import { describe, expect, it } from 'vitest';
import { createFpsState, damagePlayer, fire, reload, switchWeapon } from './logic';

describe('arena FPS gameplay', () => {
  it('menembak, reload, dan mengganti tiga senjata', () => {
    let state = createFpsState(5);
    state = fire(state, 0);
    expect(state.loadout.pistol.magazine).toBe(11);
    state = switchWeapon(state, 'rifle');
    expect(state.activeWeapon).toBe('rifle');
    state = reload({ ...state, loadout: { ...state.loadout, rifle: { magazine: 0, reserve: 12 } } });
    expect(state.loadout.rifle).toEqual({ magazine: 12, reserve: 0 });
  });

  it('mengurangi satu nyawa lalu memberi invulnerability 1000ms', () => {
    const hit = damagePlayer(createFpsState(5), 2000);
    expect(hit.lives).toBe(4);
    expect(damagePlayer(hit, 2500).lives).toBe(4);
    expect(damagePlayer(hit, 3000).lives).toBe(3);
  });
});
