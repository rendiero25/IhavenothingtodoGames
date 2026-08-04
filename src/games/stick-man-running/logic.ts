import { mulberry32 } from '../../core/rng';
import {
  ARENA_LEFT,
  ARENA_RIGHT,
  ATTACK_HEIGHT,
  BASE_ATTACK_RANGE,
  BOSS_MILESTONE_WAVE,
  COMBO_WINDOW_MS,
  ENEMY_TUNING,
  FLOOR_Y,
  GRAVITY,
  FINISHER_HIT_STOP_MS,
  HIT_STOP_MS,
  HIT_STUN_MS,
  JUMP_VELOCITY,
  MAX_ENEMIES_PER_WAVE,
  PAPERCLIP_COMBO_WINDOW_MS,
  PAPER_PROJECTILE_SPEED,
  PENCIL_PROJECTILE_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_GROUND_DRAG,
  PLAYER_HALF_WIDTH,
  PLAYER_INVULNERABILITY_MS,
  PLAYER_SPEED,
  PROJECTILE_HIT_RADIUS,
  PROJECTILE_LIFETIME_MS,
  RUN_DUST_INTERVAL_MS,
  WAVE_SCORE_BONUS,
  WEAPON_ORDER,
  WEAPON_TUNING,
  type EffectState,
  type EnemyKind,
  type EnemyState,
  type GameState,
  type InputState,
  type PickupState,
  type PlayerState,
  type ProjectileState,
} from './config';

export type {
  EffectState,
  EnemyKind,
  EnemyState,
  GameState,
  InputState,
  PickupState,
  PlayerState,
  ProjectileKind,
  ProjectileState,
  WeaponKind,
} from './config';

const EPSILON = 0.001;
const CONTACT_DISTANCE = 37;
const THROWER_ATTACK_DISTANCE = 360;

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
  if (wave >= 3) return ['runner', 'blocker', 'thrower'];
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
    projectileCooldown: tuning.projectileIntervalMs,
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

function spawnPickup(seed: number, wave: number): PickupState[] {
  if (wave < 2 || wave % 2 !== 0) return [];
  const rand = waveRandom(seed ^ 0x51f15e, wave);
  const kind = WEAPON_ORDER[Math.floor(rand() * WEAPON_ORDER.length)];
  return [{
    id: wave * 100,
    kind,
    x: 220 + rand() * 520,
    y: FLOOR_Y - 18,
    active: true,
  }];
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
      weaponExpiresAt: 0,
      invulnerableUntil: 0,
    },
    enemies: spawnWave(seed, 1),
    pickups: [],
    projectiles: [],
    effects: [],
    hitStopMs: 0,
    nextProjectileId: 1,
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

  return {
    ...player,
    x: clamp(player.x + vx * dt, ARENA_LEFT + PLAYER_HALF_WIDTH, ARENA_RIGHT - PLAYER_HALF_WIDTH),
    y: grounded ? FLOOR_Y : rawY,
    vx,
    vy: grounded ? 0 : vy,
    facing: nextFacing,
    grounded,
    comboStep: time > player.comboExpiresAt ? 0 : player.comboStep,
    weapon: player.weapon && time < player.weaponExpiresAt ? player.weapon : undefined,
    weaponExpiresAt: player.weapon && time < player.weaponExpiresAt ? player.weaponExpiresAt : 0,
  };
}

function attackValues(player: PlayerState): { damage: number; range: number; knockback: number; windowMs: number; scoreMultiplier: number } {
  const weapon = player.weapon ? WEAPON_TUNING[player.weapon] : undefined;
  const stepDamage = player.comboStep === 3 ? 2 : 1;
  const stepRange = player.comboStep === 2 ? 1.2 : player.comboStep === 3 ? 1.35 : 1;
  const stepKnockback = player.comboStep === 3 ? 2.2 : player.comboStep === 2 ? 1.3 : 1;
  return {
    damage: weapon?.damage ?? stepDamage,
    range: BASE_ATTACK_RANGE * stepRange * (weapon?.rangeMultiplier ?? 1),
    knockback: 210 * stepKnockback * (weapon?.knockbackMultiplier ?? 1),
    windowMs: player.weapon === 'paperclip' ? PAPERCLIP_COMBO_WINDOW_MS : COMBO_WINDOW_MS,
    scoreMultiplier: weapon?.scoreMultiplier ?? 1,
  };
}

function applyPunch(state: GameState, input: InputState): GameState {
  if (!input.punchPressed) return state;

  const continued = state.player.comboStep > 0 && state.time <= state.player.comboExpiresAt;
  const comboStep = continued && state.player.comboStep < 3 ? state.player.comboStep + 1 : 1;
  const attackPlayer = { ...state.player, comboStep };
  const attack = attackValues(attackPlayer);
  const direction = attackPlayer.facing;
  if (attackPlayer.weapon === 'pencil') {
    const projectile: ProjectileState = {
      id: state.nextProjectileId,
      kind: 'pencil',
      owner: 'player',
      sourceId: 0,
      x: attackPlayer.x + direction * 30,
      y: attackPlayer.y - 42,
      vx: direction * PENCIL_PROJECTILE_SPEED,
      damage: attack.damage,
      knockback: direction * attack.knockback,
      expiresAt: state.time + PROJECTILE_LIFETIME_MS,
    };
    return {
      ...state,
      player: { ...attackPlayer, comboExpiresAt: state.time + attack.windowMs },
      projectiles: [...state.projectiles, projectile],
      nextProjectileId: state.nextProjectileId + 1,
    };
  }
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
    if (enemy.kind === 'thrower') {
      if (absoluteDistance < tuning.preferredRange - 34) targetVelocity *= -0.72;
      else if (absoluteDistance <= tuning.preferredRange + 34) targetVelocity = 0;
    }
    if (enemy.kind === 'boss' && absoluteDistance < tuning.preferredRange) targetVelocity = 0;

    const stunned = time < enemy.stunUntil;
    const vx = stunned
      ? approach(enemy.vx, 0, 520 * dt)
      : approach(enemy.vx, targetVelocity, 620 * dt);
    const projectileCooldown = Math.max(0, enemy.projectileCooldown - dt * 1_000);
    const telegraph = enemy.kind === 'thrower' || enemy.kind === 'boss'
      ? projectileCooldown <= 360 ? clamp(1 - projectileCooldown / 360, 0, 1) : 0
      : absoluteDistance <= 72 ? clamp(1 - absoluteDistance / 72, 0, 1) : 0;

    return {
      ...enemy,
      x: clamp(enemy.x + vx * dt, ARENA_LEFT, ARENA_RIGHT),
      vx,
      facing,
      telegraph,
      knockback: Math.max(0, enemy.knockback - 500 * dt),
      projectileCooldown,
    };
  });
}

function spawnEnemyProjectiles(state: GameState): GameState {
  let nextProjectileId = state.nextProjectileId;
  const projectiles: ProjectileState[] = [];
  const effects: EffectState[] = [];
  const enemies = state.enemies.map((enemy) => {
    const ranged = enemy.kind === 'thrower' || enemy.kind === 'boss';
    const inRange = Math.abs(enemy.x - state.player.x) <= THROWER_ATTACK_DISTANCE;
    if (!ranged || enemy.projectileCooldown > EPSILON || !inRange || state.time < enemy.stunUntil) return enemy;

    const direction: -1 | 1 = state.player.x < enemy.x ? -1 : 1;
    projectiles.push({
      id: nextProjectileId,
      kind: 'paper',
      owner: 'enemy',
      sourceId: enemy.id,
      x: enemy.x + direction * 24,
      y: enemy.y - 40,
      vx: direction * PAPER_PROJECTILE_SPEED,
      damage: ENEMY_TUNING[enemy.kind].contactDamage,
      knockback: direction * (enemy.kind === 'boss' ? 310 : 220),
      expiresAt: state.time + PROJECTILE_LIFETIME_MS,
    });
    nextProjectileId += 1;
    if (enemy.kind === 'boss') {
      effects.push({
        kind: 'erase-lines',
        x: (enemy.x + state.player.x) / 2,
        y: FLOOR_Y - 90,
        life: 900,
        maxLife: 900,
        strength: 1.5,
      });
    }
    return {
      ...enemy,
      projectileCooldown: ENEMY_TUNING[enemy.kind].projectileIntervalMs,
      telegraph: 0,
    };
  });

  if (projectiles.length === 0) return state;
  return {
    ...state,
    enemies,
    projectiles: [...state.projectiles, ...projectiles],
    effects: [...state.effects, ...effects],
    nextProjectileId,
  };
}

function crossesTarget(previousX: number, nextX: number, targetX: number, radius: number): boolean {
  return targetX >= Math.min(previousX, nextX) - radius && targetX <= Math.max(previousX, nextX) + radius;
}

function updateProjectiles(state: GameState, dt: number): GameState {
  let player = state.player;
  let lives = state.lives;
  let gameOver = state.gameOver;
  let enemies = state.enemies;
  let score = state.score;
  let combo = state.combo;
  let bestCombo = state.bestCombo;
  let hitStopMs = state.hitStopMs;
  const effects = [...state.effects];
  const projectiles: ProjectileState[] = [];

  for (const projectile of state.projectiles) {
    if (state.time >= projectile.expiresAt) continue;
    const x = projectile.x + projectile.vx * dt;
    if (x < ARENA_LEFT - 36 || x > ARENA_RIGHT + 36) continue;

    if (projectile.owner === 'player') {
      const target = enemies
        .filter((enemy) => Math.abs(enemy.y - projectile.y) <= PROJECTILE_HIT_RADIUS + 28
          && crossesTarget(projectile.x, x, enemy.x, PROJECTILE_HIT_RADIUS))
        .sort((a, b) => Math.abs(a.x - projectile.x) - Math.abs(b.x - projectile.x))[0];
      if (!target) {
        projectiles.push({ ...projectile, x });
        continue;
      }

      const hp = target.hp - projectile.damage;
      const defeated = hp <= 0;
      enemies = enemies.flatMap((enemy) => {
        if (enemy.id !== target.id) return [enemy];
        if (defeated) return [];
        return [{
          ...enemy,
          hp,
          vx: projectile.knockback,
          knockback: Math.abs(projectile.knockback),
          stunUntil: state.time + HIT_STUN_MS,
          telegraph: 0,
        }];
      });
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      score += 20 + (defeated ? 80 : 0);
      hitStopMs = Math.max(hitStopMs, HIT_STOP_MS);
      effects.push(
        { kind: 'impact', x: target.x, y: target.y - 42, life: 125, maxLife: 125, strength: 1 },
        { kind: 'burst', x: target.x, y: target.y - 42, life: 210, maxLife: 210, strength: 1 },
      );
      continue;
    }

    const hitPlayer = Math.abs((player.y - 38) - projectile.y) <= PROJECTILE_HIT_RADIUS + 24
      && crossesTarget(projectile.x, x, player.x, PROJECTILE_HIT_RADIUS);
    if (!hitPlayer) {
      projectiles.push({ ...projectile, x });
      continue;
    }
    if (state.time < player.invulnerableUntil || gameOver) continue;

    lives = Math.max(0, lives - projectile.damage);
    gameOver = lives === 0;
    combo = 0;
    player = {
      ...player,
      vx: projectile.knockback,
      invulnerableUntil: gameOver ? Number.POSITIVE_INFINITY : state.time + PLAYER_INVULNERABILITY_MS,
    };
    effects.push({ kind: 'page-shift', x: player.x, y: player.y, life: 180, maxLife: 180, strength: 1.15 });
  }

  return { ...state, player, lives, gameOver, enemies, projectiles, effects, score, combo, bestCombo, hitStopMs };
}

function collectPickups(player: PlayerState, pickups: readonly PickupState[], time: number): { player: PlayerState; pickups: PickupState[]; effects: EffectState[] } {
  let nextPlayer = player;
  const effects: EffectState[] = [];
  const nextPickups = pickups.map((pickup) => {
    if (!pickup.active || Math.abs(pickup.x - player.x) > 34 || Math.abs(pickup.y - player.y) > 42) return pickup;
    nextPlayer = {
      ...nextPlayer,
      weapon: pickup.kind,
      weaponExpiresAt: time + WEAPON_TUNING[pickup.kind].durationMs,
    };
    effects.push({ kind: 'burst', x: pickup.x, y: pickup.y, life: 260, maxLife: 260, strength: 1.2 });
    return { ...pickup, active: false };
  });
  return { player: nextPlayer, pickups: nextPickups, effects };
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

  const collected = collectPickups(next.player, next.pickups, time);
  next = {
    ...next,
    player: collected.player,
    pickups: collected.pickups,
    effects: [...next.effects, ...collected.effects],
  };
  next = applyPunch(next, input);
  next = { ...next, enemies: updateEnemies(next.enemies, next.player, dt, time) };
  next = spawnEnemyProjectiles(next);
  next = updateProjectiles(next, dt);
  next = applyEnemyContactDamage(next);

  if (!next.gameOver && next.enemies.length === 0) {
    const wave = next.wave + 1;
    return {
      ...next,
      wave,
      score: next.score + WAVE_SCORE_BONUS * next.wave,
      enemies: spawnWave(seed, wave),
      pickups: spawnPickup(seed, wave),
      effects: [...next.effects, { kind: 'page-shift', x: next.player.x, y: FLOOR_Y, life: 220, maxLife: 220, strength: 0.75 }],
    };
  }

  return next;
}
