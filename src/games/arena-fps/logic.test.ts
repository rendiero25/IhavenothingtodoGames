import { describe, expect, it } from 'vitest';
import {
  buildFpsResult,
  createFpsState,
  damagePlayer,
  favoriteWeaponIndex,
  fire,
  refillWaveReserves,
  registerHit,
  reload,
  switchWeapon,
} from './logic';

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

  it('kill headshot memperbarui skor, combo, dan statistik', () => {
    const result = registerHit(createFpsState(5), true, true, 100);
    expect(result).toMatchObject({
      score: 100,
      combo: 1,
      bestCombo: 1,
      kills: 1,
      hits: 1,
      headshots: 1,
    });
  });

  it('damage memutus combo', () => {
    const scored = registerHit(createFpsState(5), false, true, 50);
    expect(damagePlayer(scored, 1000).combo).toBe(0);
  });

  it('memilih indeks senjata dengan tembakan terbanyak untuk statistik hasil', () => {
    expect(favoriteWeaponIndex({ pistol: 2, rifle: 7, shotgun: 4 })).toBe(1);
    expect(favoriteWeaponIndex({ pistol: 2, rifle: 7, shotgun: 9 })).toBe(2);
    expect(favoriteWeaponIndex({ pistol: 0, rifle: 0, shotgun: 0 })).toBe(0);
  });

  it('refill antar-wave mengembalikan reserve rifle dan shotgun ke batas awal', () => {
    const depleted = createFpsState(5);
    depleted.loadout.rifle.reserve = 3;
    depleted.loadout.shotgun.reserve = 0;

    const refilled = refillWaveReserves(depleted);

    expect(refilled.loadout.rifle.reserve).toBe(90);
    expect(refilled.loadout.shotgun.reserve).toBe(24);
    expect(refilled.loadout.pistol.reserve).toBe(Number.POSITIVE_INFINITY);
  });

  it('membentuk hasil timeup lengkap dengan livesLeft dan statistik numerik', () => {
    const state = registerHit(createFpsState(3), true, true, 100);
    state.shots = 4;
    state.hits = 3;
    state.shotsByWeapon.rifle = 5;

    expect(buildFpsResult(state, 5, 1234.6, 'timeup')).toEqual({
      score: 100,
      bestCombo: 1,
      levelReached: 5,
      durationMs: 1235,
      livesLeft: 3,
      endReason: 'timeup',
      stats: {
        kills: 1,
        accuracy: 75,
        headshots: 1,
        wave: 5,
        favoriteWeapon: 1,
      },
    });
  });
});
