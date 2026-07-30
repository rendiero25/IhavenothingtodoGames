export type WeaponId = 'pistol' | 'rifle' | 'shotgun';

export type EnemyKind = 'drone' | 'runner' | 'turret' | 'soldier' | 'zombie';

export interface WeaponSpec {
  magazine: number;
  reserve: number;
  damage: number;
  intervalMs: number;
  pellets: number;
  spread: number;
}

export const WEAPONS = {
  pistol: { magazine: 12, reserve: Number.POSITIVE_INFINITY, damage: 34, intervalMs: 260, pellets: 1, spread: 0.006 },
  rifle: { magazine: 30, reserve: 90, damage: 20, intervalMs: 110, pellets: 1, spread: 0.014 },
  shotgun: { magazine: 6, reserve: 24, damage: 18, intervalMs: 700, pellets: 7, spread: 0.075 },
} satisfies Record<WeaponId, WeaponSpec>;

export interface EnemySpawn {
  id: string;
  kind: EnemyKind;
  x: number;
  z: number;
  yaw: number;
  health: number;
  boss: boolean;
}

export interface AmmoState {
  magazine: number;
  reserve: number;
}

export interface FpsState {
  lives: number;
  invulnerableUntil: number;
  activeWeapon: WeaponId;
  loadout: Record<WeaponId, AmmoState>;
  score: number;
  combo: number;
  bestCombo: number;
  kills: number;
  shots: number;
  shotsByWeapon: Record<WeaponId, number>;
  hits: number;
  headshots: number;
}
