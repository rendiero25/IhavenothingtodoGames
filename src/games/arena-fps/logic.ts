import type { EndReason, GameResult } from '../types';
import { WEAPONS, type FpsState, type WeaponId } from './config';

export type { AmmoState, EnemyKind, EnemySpawn, FpsState, WeaponId, WeaponSpec } from './config';

const MAX_SIMULATION_DELTA_MS = 50;

export function frameDeltas(previousMs: number, currentMs: number): { elapsedMs: number; simulationMs: number } {
  const elapsedMs = Math.max(0, currentMs - previousMs);
  return { elapsedMs, simulationMs: Math.min(MAX_SIMULATION_DELTA_MS, elapsedMs) };
}

export function createFpsState(lives = 5): FpsState {
  return {
    lives,
    invulnerableUntil: 0,
    activeWeapon: 'pistol',
    loadout: {
      pistol: { magazine: WEAPONS.pistol.magazine, reserve: WEAPONS.pistol.reserve },
      rifle: { magazine: WEAPONS.rifle.magazine, reserve: WEAPONS.rifle.reserve },
      shotgun: { magazine: WEAPONS.shotgun.magazine, reserve: WEAPONS.shotgun.reserve },
    },
    score: 0,
    combo: 0,
    bestCombo: 0,
    kills: 0,
    shots: 0,
    projectilesFired: 0,
    shotsByWeapon: { pistol: 0, rifle: 0, shotgun: 0 },
    hits: 0,
    headshots: 0,
  };
}

export function fire(state: FpsState, _nowMs: number): FpsState {
  const weapon = state.activeWeapon;
  const ammo = state.loadout[weapon];
  if (ammo.magazine <= 0) return state;

  return {
    ...state,
    loadout: { ...state.loadout, [weapon]: { ...ammo, magazine: ammo.magazine - 1 } },
    shots: state.shots + 1,
    projectilesFired: state.projectilesFired + WEAPONS[weapon].pellets,
    shotsByWeapon: { ...state.shotsByWeapon, [weapon]: state.shotsByWeapon[weapon] + 1 },
  };
}

export function reload(state: FpsState): FpsState {
  const weapon = state.activeWeapon;
  const ammo = state.loadout[weapon];
  const missing = WEAPONS[weapon].magazine - ammo.magazine;
  if (missing <= 0 || ammo.reserve <= 0) return state;

  const moved = Number.isFinite(ammo.reserve) ? Math.min(missing, ammo.reserve) : missing;
  return {
    ...state,
    loadout: {
      ...state.loadout,
      [weapon]: {
        magazine: ammo.magazine + moved,
        reserve: Number.isFinite(ammo.reserve) ? ammo.reserve - moved : Number.POSITIVE_INFINITY,
      },
    },
  };
}

export function switchWeapon(state: FpsState, weapon: WeaponId): FpsState {
  return state.activeWeapon === weapon ? state : { ...state, activeWeapon: weapon };
}

export function comboMultiplier(combo: number): number {
  return 1 + Math.floor(Math.max(0, combo - 1) / 5) * 0.25;
}

export function registerHit(state: FpsState, headshot: boolean, killed: boolean, points: number): FpsState {
  const combo = killed ? state.combo + 1 : state.combo;
  return {
    ...state,
    hits: state.hits + 1,
    headshots: state.headshots + (headshot ? 1 : 0),
    kills: state.kills + (killed ? 1 : 0),
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    score: state.score + points * comboMultiplier(combo),
  };
}

export function damagePlayer(state: FpsState, nowMs: number): FpsState {
  if (state.lives <= 0 || nowMs < state.invulnerableUntil) return state;
  return { ...state, lives: state.lives - 1, invulnerableUntil: nowMs + 1000, combo: 0 };
}

export function favoriteWeaponIndex(shots: FpsState['shotsByWeapon']): number {
  const counts = [shots.pistol, shots.rifle, shots.shotgun];
  return counts.indexOf(Math.max(...counts));
}

export function refillWaveReserves(state: FpsState): FpsState {
  return {
    ...state,
    loadout: {
      ...state.loadout,
      rifle: { ...state.loadout.rifle, reserve: WEAPONS.rifle.reserve },
      shotgun: { ...state.loadout.shotgun, reserve: WEAPONS.shotgun.reserve },
    },
  };
}

export function buildFpsResult(
  state: FpsState,
  wave: number,
  elapsed: number,
  endReason: EndReason,
): GameResult {
  return {
    score: state.score,
    bestCombo: state.bestCombo,
    levelReached: wave,
    durationMs: Math.round(elapsed),
    livesLeft: state.lives,
    endReason,
    stats: {
      kills: state.kills,
      accuracy:
        state.projectilesFired === 0
          ? 0
          : Math.min(100, Math.round((state.hits / state.projectilesFired) * 100)),
      headshots: state.headshots,
      wave,
      favoriteWeapon: favoriteWeaponIndex(state.shotsByWeapon),
    },
  };
}
