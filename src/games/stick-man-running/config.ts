export type EnemyKind = 'runner' | 'blocker' | 'kicker' | 'boss';
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
  attackStep: 0 | 1 | 2 | 3;
  attackStartedAt: number;
  attackFacing: -1 | 1;
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
}

export interface EffectState {
  kind: 'impact' | 'dust' | 'burst' | 'page-shift';
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
  effects: EffectState[];
  hitStopMs: number;
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
export const ATTACK_ANIMATION_MS = 360;
export const ATTACK_LUNGE_SPEED = 420;
export const FINISHER_JUMP_VELOCITY = -300;
export const ATTACK_HEIGHT = 82;
export const BASE_ATTACK_RANGE = 68;
export const HIT_STUN_MS = 150;
export const HIT_STOP_MS = 48;
export const FINISHER_HIT_STOP_MS = 72;
export const RUN_DUST_INTERVAL_MS = 140;

export const BOSS_MILESTONE_WAVE = 5;
export const MAX_ENEMIES_PER_WAVE = 10;
export const WAVE_SCORE_BONUS = 100;

export interface EnemyTuning {
  hp: number;
  speed: number;
  contactDamage: number;
  preferredRange: number;
}

export const ENEMY_TUNING: Readonly<Record<EnemyKind, EnemyTuning>> = {
  runner: { hp: 2, speed: 132, contactDamage: 1, preferredRange: 0 },
  blocker: { hp: 5, speed: 68, contactDamage: 1, preferredRange: 0 },
  kicker: { hp: 3, speed: 96, contactDamage: 1, preferredRange: 72 },
  boss: { hp: 18, speed: 76, contactDamage: 1, preferredRange: 92 },
};
