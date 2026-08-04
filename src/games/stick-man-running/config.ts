export type EnemyKind = 'runner' | 'blocker' | 'thrower' | 'boss';
export type WeaponKind = 'ruler' | 'eraser' | 'pencil' | 'paperclip';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  punchPressed: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  grounded: boolean;
  comboStep: number;
  comboExpiresAt: number;
  weapon?: WeaponKind;
  weaponExpiresAt: number;
  invulnerableUntil: number;
}

export interface EnemyState {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  hp: number;
  maxHp: number;
  facing: -1 | 1;
  telegraph: number;
  stunUntil: number;
  knockback: number;
  projectileCooldown: number;
}

export interface PickupState {
  id: number;
  kind: WeaponKind;
  x: number;
  y: number;
  active: boolean;
}

export type ProjectileKind = 'paper' | 'pencil';

export interface ProjectileState {
  id: number;
  kind: ProjectileKind;
  owner: 'player' | 'enemy';
  sourceId: number;
  x: number;
  y: number;
  vx: number;
  damage: number;
  knockback: number;
  expiresAt: number;
}

export interface EffectState {
  kind: 'impact' | 'dust' | 'burst' | 'page-shift' | 'erase-lines';
  x: number;
  y: number;
  life: number;
  maxLife: number;
  strength: number;
}

export interface GameState {
  time: number;
  wave: number;
  score: number;
  combo: number;
  bestCombo: number;
  lives: number;
  gameOver: boolean;
  player: PlayerState;
  enemies: EnemyState[];
  pickups: PickupState[];
  projectiles: ProjectileState[];
  effects: EffectState[];
  hitStopMs: number;
  nextProjectileId: number;
}

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;
export const FLOOR_Y = 444;
export const ARENA_LEFT = 36;
export const ARENA_RIGHT = LOGICAL_WIDTH - 36;

export const PLAYER_HALF_WIDTH = 18;
export const PLAYER_HEIGHT = 74;
export const PLAYER_SPEED = 280;
export const PLAYER_ACCELERATION = 2_500;
export const PLAYER_GROUND_DRAG = 2_900;
export const JUMP_VELOCITY = -650;
export const GRAVITY = 1_800;
export const PLAYER_INVULNERABILITY_MS = 850;

export const COMBO_WINDOW_MS = 410;
export const PAPERCLIP_COMBO_WINDOW_MS = 570;
export const ATTACK_HEIGHT = 82;
export const BASE_ATTACK_RANGE = 68;
export const HIT_STUN_MS = 150;
export const HIT_STOP_MS = 48;
export const FINISHER_HIT_STOP_MS = 72;
export const PROJECTILE_LIFETIME_MS = 1_800;
export const PAPER_PROJECTILE_SPEED = 330;
export const PENCIL_PROJECTILE_SPEED = 650;
export const PROJECTILE_HIT_RADIUS = 30;
export const RUN_DUST_INTERVAL_MS = 140;

export const BOSS_MILESTONE_WAVE = 5;
export const MAX_ENEMIES_PER_WAVE = 10;
export const WAVE_SCORE_BONUS = 100;

export interface EnemyTuning {
  hp: number;
  speed: number;
  contactDamage: number;
  preferredRange: number;
  projectileIntervalMs: number;
}

export const ENEMY_TUNING: Readonly<Record<EnemyKind, EnemyTuning>> = {
  runner: { hp: 2, speed: 132, contactDamage: 1, preferredRange: 0, projectileIntervalMs: 0 },
  blocker: { hp: 5, speed: 68, contactDamage: 1, preferredRange: 0, projectileIntervalMs: 0 },
  thrower: { hp: 3, speed: 84, contactDamage: 1, preferredRange: 235, projectileIntervalMs: 1_650 },
  boss: { hp: 18, speed: 76, contactDamage: 1, preferredRange: 92, projectileIntervalMs: 1_200 },
};

export interface WeaponTuning {
  durationMs: number;
  rangeMultiplier: number;
  damage: number;
  knockbackMultiplier: number;
  scoreMultiplier: number;
}

export const WEAPON_TUNING: Readonly<Record<WeaponKind, WeaponTuning>> = {
  ruler: { durationMs: 7_500, rangeMultiplier: 1.75, damage: 2, knockbackMultiplier: 1.1, scoreMultiplier: 1 },
  eraser: { durationMs: 6_000, rangeMultiplier: 1.05, damage: 3, knockbackMultiplier: 1.9, scoreMultiplier: 1 },
  pencil: { durationMs: 6_500, rangeMultiplier: 3.3, damage: 2, knockbackMultiplier: 0.85, scoreMultiplier: 1 },
  paperclip: { durationMs: 8_000, rangeMultiplier: 0.9, damage: 1, knockbackMultiplier: 0.7, scoreMultiplier: 2 },
};

export const WEAPON_ORDER: readonly WeaponKind[] = ['ruler', 'eraser', 'pencil', 'paperclip'];
