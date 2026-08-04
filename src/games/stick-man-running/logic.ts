import { mulberry32 } from '../../core/rng';
import {
  ARENA_LEFT,
  ARENA_RIGHT,
  ATTACK_ANIMATION_MS,
  ATTACK_HEIGHT,
  ATTACK_LUNGE_SPEED,
  BASE_ATTACK_RANGE,
  BOSS_MILESTONE_WAVE,
  COMBO_WINDOW_MS,
  ENEMY_TUNING,
  FLOOR_Y,
  GRAVITY,
  FINISHER_HIT_STOP_MS,
  FINISHER_JUMP_VELOCITY,
  HIT_STOP_MS,
  HIT_STUN_MS,
  JUMP_VELOCITY,
  MAX_ENEMIES_PER_WAVE,
  PLAYER_ACCELERATION,
  PLAYER_GROUND_DRAG,
  PLAYER_HALF_WIDTH,
  PLAYER_INVULNERABILITY_MS,
  PLAYER_SPEED,
  RUN_DUST_INTERVAL_MS,
  WAVE_SCORE_BONUS,
  type EffectState,
  type EnemyKind,
  type EnemyState,
  type GameState,
  type InputState,
  type PlayerState,
} from './config';

export type {
  EffectState,
  EnemyKind,
  EnemyState,
  GameState,
  InputState,
  PlayerState,
} from './config';

const CONTACT_DISTANCE = 37;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function approach(value: number, target: number, amount: number): number {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function waveRandom(seed: number, wave: number): () => number {
  return mulberry32((seed ^ Math.imul(Math.max(1, wave), 0x9e3779b1)) >>> 0);
}

function enemyCount(wave: number): number {
  return Math.min(MAX_ENEMIES_PER_WAVE, 1 + Math.floor(Math.max(1, wave) * 0.75));
}

function unlockedKinds(wave: number): readonly Exclude<EnemyKind, 'boss'>[] {
  if (wave >= 3) return ['runner', 'blocker', 'kicker'];
  if (wave >= 2) return ['runner', 'blocker'];
  return ['runner'];
}

function makeEnemy(kind: EnemyKind, id: number, x: number, wave: number): EnemyState {
  const tuning = ENEMY_TUNING[kind];
  const waveHealth = kind === 'boss' ? Math.floor((wave - BOSS_MILESTONE_WAVE) / BOSS_MILESTONE_WAVE) * 4 : Math.floor((wave - 1) / 4);
  const hp = tuning.hp + Math.max(0, waveHealth);
  return {
    id,
    kind,
    x,
    y: FLOOR_Y,
    vx: 0,
    hp,
    maxHp: hp,
    facing: x < 480 ? 1 : -1,
    telegraph: 0,
    stunUntil: 0,
    knockback: 0,
  };
}

export function spawnWave(seed: number, wave: number): EnemyState[] {
  const safeWave = Math.max(1, Math.floor(wave));
  const rand = waveRandom(seed, safeWave);
  const count = enemyCount(safeWave);
  const kinds = unlockedKinds(safeWave);
  const bossWave = safeWave % BOSS_MILESTONE_WAVE === 0;
  const bossIndex = bossWave ? Math.floor(rand() * count) : -1;

  return Array.from({ length: count }, (_, index) => {
    const side: -1 | 1 = rand() < 0.5 ? -1 : 1;
    const edge = side === -1 ? ARENA_LEFT + 16 : ARENA_RIGHT - 16;
    const inset = 4 + rand() * Math.min(72, safeWave * 5);
    const x = clamp(edge - side * inset, ARENA_LEFT, ARENA_RIGHT);
    const kind = index === bossIndex ? 'boss' : kinds[Math.floor(rand() * kinds.length)];
    return makeEnemy(kind, safeWave * 100 + index, x, safeWave);
  });
}

export function createInitialState(seed: number, lives: number): GameState {
  const safeLives = Math.max(0, Math.floor(lives));
  return {
    time: 0,
    wave: 1,
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: safeLives,
    gameOver: safeLives === 0,
    player: {
      x: 480,
      y: FLOOR_Y,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      comboStep: 0,
      comboExpiresAt: 0,
      attackStep: 0,
      attackStartedAt: 0,
      attackFacing: 1,
      invulnerableUntil: 0,
    },
    enemies: spawnWave(seed, 1),
    effects: [],
    hitStopMs: 0,
  };
}

function updatePlayer(player: PlayerState, input: InputState, dt: number, time: number): PlayerState {
  const direction = Number(input.right) - Number(input.left);
  const targetVelocity = direction * PLAYER_SPEED;
  const acceleration = direction === 0 && player.grounded ? PLAYER_GROUND_DRAG : PLAYER_ACCELERATION;
  const vx = approach(player.vx, targetVelocity, acceleration * dt);
  const nextFacing = direction === 0 ? player.facing : direction < 0 ? -1 : 1;
  const shouldJump = input.jumpPressed && player.grounded;
  const initialVy = shouldJump ? JUMP_VELOCITY : player.vy;
  const vy = initialVy + GRAVITY * dt;
  const rawY = player.y + vy * dt;
  const grounded = rawY >= FLOOR_Y;
  const attackActive = player.attackStep > 0 && time - player.attackStartedAt < ATTACK_ANIMATION_MS;

  return {
    ...player,
    x: clamp(player.x + vx * dt, ARENA_LEFT + PLAYER_HALF_WIDTH, ARENA_RIGHT - PLAYER_HALF_WIDTH),
    y: grounded ? FLOOR_Y : rawY,
    vx,
    vy: grounded ? 0 : vy,
    facing: nextFacing,
    grounded,
    comboStep: time > player.comboExpiresAt ? 0 : player.comboStep,
    attackStep: attackActive ? player.attackStep : 0,
    attackFacing: attackActive ? player.attackFacing : nextFacing,
  };
}

function attackValues(player: PlayerState): { damage: number; range: number; knockback: number; windowMs: number; scoreMultiplier: number } {
  const stepDamage = player.comboStep === 3 ? 2 : 1;
  const stepRange = player.comboStep === 2 ? 1.2 : player.comboStep === 3 ? 1.35 : 1;
  const stepKnockback = player.comboStep === 3 ? 2.2 : player.comboStep === 2 ? 1.3 : 1;
  return {
    damage: stepDamage,
    range: BASE_ATTACK_RANGE * stepRange,
    knockback: 210 * stepKnockback,
    windowMs: COMBO_WINDOW_MS,
    scoreMultiplier: 1,
  };
}

function applyPunch(state: GameState, input: InputState): GameState {
  if (!input.punchPressed) return state;

  const continued = state.player.comboStep > 0 && state.time <= state.player.comboExpiresAt;
  const comboStep = continued && state.player.comboStep < 3 ? state.player.comboStep + 1 : 1;
  const attackFacing = state.player.facing;
  const lungeSpeed = comboStep === 3 ? ATTACK_LUNGE_SPEED : comboStep === 2 ? ATTACK_LUNGE_SPEED * 0.72 : ATTACK_LUNGE_SPEED * 0.48;
  const attackPlayer = {
    ...state.player,
    comboStep,
    attackStep: comboStep as 0 | 1 | 2 | 3,
    attackStartedAt: state.time,
    attackFacing,
    vx: attackFacing * Math.max(Math.abs(state.player.vx), lungeSpeed),
    ...(comboStep === 3 && state.player.grounded ? { grounded: false, vy: FINISHER_JUMP_VELOCITY } : {}),
  };
  const attack = attackValues(attackPlayer);
  const direction = attackPlayer.facing;
  const hits = state.enemies.filter((enemy) => {
    const forwardDistance = (enemy.x - attackPlayer.x) * direction;
    return forwardDistance >= -8 && forwardDistance <= attack.range && Math.abs(enemy.y - attackPlayer.y) <= ATTACK_HEIGHT;
  });
  const hitIds = new Set(hits.map((enemy) => enemy.id));
  let defeated = 0;
  const enemies = state.enemies.flatMap((enemy) => {
    if (!hitIds.has(enemy.id)) return [enemy];
    const hp = enemy.hp - attack.damage;
    if (hp <= 0) {
      defeated += 1;
      return [];
    }
    return [{
      ...enemy,
      hp,
      vx: direction * attack.knockback,
      knockback: attack.knockback,
      stunUntil: state.time + HIT_STUN_MS,
      telegraph: 0,
    }];
  });
  const successfulHits = hits.length;
  const combo = successfulHits > 0 ? state.combo + successfulHits : 0;
  const effectStrength = comboStep === 3 ? 1.8 : 1;
  const effects = successfulHits === 0 ? state.effects : [
    ...state.effects,
    { kind: 'impact' as const, x: attackPlayer.x + direction * attack.range * 0.72, y: attackPlayer.y - 48, life: 125, maxLife: 125, strength: effectStrength },
    { kind: 'burst' as const, x: attackPlayer.x + direction * attack.range * 0.8, y: attackPlayer.y - 42, life: 210, maxLife: 210, strength: effectStrength },
  ];

  return {
    ...state,
    player: { ...attackPlayer, comboExpiresAt: state.time + attack.windowMs },
    enemies,
    effects,
    score: state.score + successfulHits * 20 * attack.scoreMultiplier + defeated * 80,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    hitStopMs: successfulHits > 0
      ? Math.max(state.hitStopMs, comboStep === 3 ? FINISHER_HIT_STOP_MS : HIT_STOP_MS)
      : state.hitStopMs,
  };
}

function updateEnemies(enemies: readonly EnemyState[], player: PlayerState, dt: number, time: number): EnemyState[] {
  return enemies.map((enemy) => {
    const tuning = ENEMY_TUNING[enemy.kind];
    const distance = player.x - enemy.x;
    const facing: -1 | 1 = distance < 0 ? -1 : 1;
    const absoluteDistance = Math.abs(distance);
    let targetVelocity = facing * tuning.speed;
    if (enemy.kind === 'kicker' && absoluteDistance <= tuning.preferredRange) targetVelocity = 0;
    if (enemy.kind === 'boss' && absoluteDistance < tuning.preferredRange) targetVelocity = 0;

    const stunned = time < enemy.stunUntil;
    const vx = stunned
      ? approach(enemy.vx, 0, 520 * dt)
      : approach(enemy.vx, targetVelocity, 620 * dt);
    const telegraph = enemy.kind === 'kicker'
      ? absoluteDistance <= 108 ? clamp(1 - absoluteDistance / 108, 0, 1) : 0
      : enemy.kind === 'boss'
        ? absoluteDistance <= 118 ? clamp(1 - absoluteDistance / 118, 0, 1) : 0
        : absoluteDistance <= 72 ? clamp(1 - absoluteDistance / 72, 0, 1) : 0;

    return {
      ...enemy,
      x: clamp(enemy.x + vx * dt, ARENA_LEFT, ARENA_RIGHT),
      vx,
      facing,
      telegraph,
      knockback: Math.max(0, enemy.knockback - 500 * dt),
    };
  });
}

function applyEnemyContactDamage(state: GameState): GameState {
  if (state.gameOver || state.time < state.player.invulnerableUntil) return state;
  let attacker: EnemyState | undefined;
  for (const enemy of state.enemies) {
    if (state.time < enemy.stunUntil) continue;
    const distance = Math.abs(enemy.x - state.player.x);
    const sharesVerticalSpace = Math.abs(enemy.y - state.player.y) <= ATTACK_HEIGHT;
    if (distance <= CONTACT_DISTANCE && sharesVerticalSpace) {
      attacker = enemy;
      break;
    }
  }
  if (!attacker) return state;

  const lives = Math.max(0, state.lives - ENEMY_TUNING[attacker.kind].contactDamage);
  const gameOver = lives === 0;
  return {
    ...state,
    lives,
    gameOver,
    combo: 0,
    player: {
      ...state.player,
      vx: -attacker.facing * 210,
      invulnerableUntil: gameOver ? Number.POSITIVE_INFINITY : state.time + PLAYER_INVULNERABILITY_MS,
    },
    effects: [
      ...state.effects,
      { kind: 'page-shift', x: state.player.x, y: state.player.y, life: 180, maxLife: 180, strength: attacker.kind === 'boss' ? 1.8 : 1 },
    ],
  };
}

function ageEffects(effects: readonly EffectState[], dtMs: number): EffectState[] {
  return effects.flatMap((effect) => {
    const life = effect.life - dtMs;
    return life > 0 ? [{ ...effect, life }] : [];
  });
}

function movementEffects(previous: GameState, player: PlayerState, time: number): EffectState[] {
  if (!previous.player.grounded && player.grounded) {
    return [
      { kind: 'dust', x: player.x, y: FLOOR_Y, life: 240, maxLife: 240, strength: 1.6 },
      { kind: 'page-shift', x: player.x, y: FLOOR_Y, life: 110, maxLife: 110, strength: 0.35 },
    ];
  }
  const crossedDustBeat = Math.floor(previous.time / RUN_DUST_INTERVAL_MS) < Math.floor(time / RUN_DUST_INTERVAL_MS);
  if (player.grounded && Math.abs(player.vx) > PLAYER_SPEED * 0.35 && crossedDustBeat) {
    return [{
      kind: 'dust',
      x: player.x - player.facing * 18,
      y: FLOOR_Y,
      life: 180,
      maxLife: 180,
      strength: 0.85,
    }];
  }
  return [];
}

export function updateGame(state: GameState, input: InputState, dtMs: number, seed: number): GameState {
  if (state.gameOver) return state;
  const elapsedMs = Math.max(0, Number.isFinite(dtMs) ? dtMs : 0);
  const physicsMs = Math.min(elapsedMs, 100);
  const dt = physicsMs / 1_000;
  const time = state.time + elapsedMs;
  let next: GameState = {
    ...state,
    time,
    hitStopMs: Math.max(0, state.hitStopMs - elapsedMs),
    effects: ageEffects(state.effects, elapsedMs),
    player: updatePlayer(state.player, input, dt, time),
  };
  next = { ...next, effects: [...next.effects, ...movementEffects(state, next.player, time)] };

  next = applyPunch(next, input);
  next = { ...next, enemies: updateEnemies(next.enemies, next.player, dt, time) };
  next = applyEnemyContactDamage(next);

  if (!next.gameOver && next.enemies.length === 0) {
    const wave = next.wave + 1;
    return {
      ...next,
      wave,
      score: next.score + WAVE_SCORE_BONUS * next.wave,
      enemies: spawnWave(seed, wave),
      effects: [...next.effects, { kind: 'page-shift', x: next.player.x, y: FLOOR_Y, life: 220, maxLife: 220, strength: 0.75 }],
    };
  }

  return next;
}
