import { describe, expect, it } from 'vitest';
import {
  ARENA_LEFT,
  ARENA_RIGHT,
  ATTACK_ANIMATION_MS,
  BOSS_MILESTONE_WAVE,
  COMBO_WINDOW_MS,
  FLOOR_Y,
  FINISHER_JUMP_VELOCITY,
  HIT_STOP_MS,
  PLAYER_HALF_WIDTH,
  PLAYER_INVULNERABILITY_MS,
  type EnemyState,
  type GameState,
  type InputState,
} from './config';
import { createInitialState, spawnWave, updateGame } from './logic';

const idle: InputState = { left: false, right: false, jumpPressed: false, punchPressed: false };

function enemy(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id: 1,
    kind: 'runner',
    x: 530,
    y: FLOOR_Y,
    vx: 0,
    hp: 5,
    maxHp: 5,
    facing: -1,
    telegraph: 0,
    stunUntil: 0,
    knockback: 0,
    ...overrides,
  };
}

function state(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(17, 5),
    enemies: [],
    ...overrides,
  };
}

describe('Stick Man Running movement', () => {
  it('moves horizontally, faces movement, and stays inside the finite arena', () => {
    let next = state({ enemies: [enemy({ y: 0 })] });
    for (let index = 0; index < 80; index += 1) {
      next = updateGame(next, { ...idle, right: true }, 100, 17);
    }
    expect(next.player.x).toBe(ARENA_RIGHT - PLAYER_HALF_WIDTH);
    expect(next.player.facing).toBe(1);

    for (let index = 0; index < 160; index += 1) {
      next = updateGame(next, { ...idle, left: true }, 100, 17);
    }
    expect(next.player.x).toBe(ARENA_LEFT + PLAYER_HALF_WIDTH);
    expect(next.player.facing).toBe(-1);
  });

  it('jumps only while grounded and lands back on the notebook floor', () => {
    let next = updateGame(state(), { ...idle, jumpPressed: true }, 16, 17);
    expect(next.player.grounded).toBe(false);
    expect(next.player.y).toBeLessThan(FLOOR_Y);
    const airborneVelocity = next.player.vy;
    next = updateGame(next, { ...idle, jumpPressed: true }, 16, 17);
    expect(next.player.vy).toBeGreaterThan(airborneVelocity);

    for (let index = 0; index < 80 && !next.player.grounded; index += 1) {
      next = updateGame(next, idle, 32, 17);
    }
    expect(next.player).toMatchObject({ y: FLOOR_Y, vy: 0, grounded: true });
    expect(next.effects.some((effect) => effect.kind === 'dust' && effect.strength > 1)).toBe(true);
  });

  it('emits deterministic graphite dust while running on the floor', () => {
    const initial = state({ enemies: [enemy({ y: 0 })] });
    const next = updateGame(initial, { ...idle, right: true }, 160, 17);
    expect(next.effects.some((effect) => effect.kind === 'dust')).toBe(true);
  });
});

describe('Stick Man Running combat', () => {
  it('tracks attack pose timing and gives each strike forward momentum', () => {
    let next = state({ enemies: [enemy({ x: 800, y: 0 })] });
    next = updateGame(next, { ...idle, punchPressed: true }, 16, 17);
    expect(next.player.attackStep).toBe(1);
    expect(next.player.attackStartedAt).toBe(next.time);
    expect(next.player.vx).toBeGreaterThan(0);

    next = updateGame(next, idle, ATTACK_ANIMATION_MS, 17);
    expect(next.player.attackStep).toBe(0);
  });

  it('turns the third combo hit into an airborne finisher', () => {
    let next = state({ enemies: [enemy({ x: 800, y: 0 })] });
    next = updateGame(next, { ...idle, punchPressed: true }, 16, 17);
    next = updateGame(next, { ...idle, punchPressed: true }, 100, 17);
    next = updateGame(next, { ...idle, punchPressed: true }, 100, 17);

    expect(next.player.attackStep).toBe(3);
    expect(next.player.vx).toBeGreaterThan(0);
    expect(next.player.grounded).toBe(false);
    expect(next.player.vy).toBe(FINISHER_JUMP_VELOCITY);
  });

  it('advances a three-hit combo inside its timing window and resets after a late hit', () => {
    let next = state({ enemies: [enemy({ x: 700 })] });
    next = updateGame(next, { ...idle, punchPressed: true }, 16, 17);
    expect(next.player.comboStep).toBe(1);
    next = updateGame(next, { ...idle, punchPressed: true }, COMBO_WINDOW_MS - 1, 17);
    expect(next.player.comboStep).toBe(2);
    next = updateGame(next, { ...idle, punchPressed: true }, COMBO_WINDOW_MS - 1, 17);
    expect(next.player.comboStep).toBe(3);
    next = updateGame(next, idle, COMBO_WINDOW_MS, 17);
    next = updateGame(next, { ...idle, punchPressed: true }, 16, 17);
    expect(next.player.comboStep).toBe(1);
  });

  it('uses a forward hitbox and applies finisher damage, stun, and knockback', () => {
    let next = state({ enemies: [enemy({ x: 535 }), enemy({ id: 2, x: 430 })] });
    next = updateGame(next, { ...idle, punchPressed: true }, 16, 17);
    next = updateGame(next, { ...idle, punchPressed: true }, 100, 17);
    next = updateGame(next, { ...idle, punchPressed: true }, 100, 17);

    const forward = next.enemies.find((item) => item.id === 1);
    const behind = next.enemies.find((item) => item.id === 2);
    expect(forward?.hp).toBe(1);
    expect(forward?.knockback).toBeGreaterThan(0);
    expect(forward?.stunUntil).toBeGreaterThan(next.time);
    expect(behind?.hp).toBe(5);
    expect(next.bestCombo).toBe(3);
    expect(next.hitStopMs).toBeGreaterThanOrEqual(HIT_STOP_MS);
  });

  it('does not attack when punchPressed is false', () => {
    const next = updateGame(state({ enemies: [enemy()] }), idle, 16, 17);
    expect(next.enemies[0].hp).toBe(5);
    expect(next.player.comboStep).toBe(0);
  });

  it('does not take contact damage from a stunned enemy', () => {
    const next = updateGame(state({
      time: 100,
      enemies: [enemy({ x: 480, stunUntil: 500 })],
    }), idle, 16, 17);
    expect(next.lives).toBe(5);
  });
});

describe('Stick Man Running waves', () => {
  it('spawns equal waves for the same seed and varies placement or roster for another seed', () => {
    expect(spawnWave(42, 4)).toEqual(spawnWave(42, 4));
    expect(spawnWave(42, 4)).not.toEqual(spawnWave(43, 4));
  });

  it('unlocks all regular enemies and guarantees the Eraser Boss on milestone waves', () => {
    const regularKinds = new Set(Array.from({ length: 12 }, (_, index) => spawnWave(100 + index, 4)).flat().map((item) => item.kind));
    expect(regularKinds).toEqual(new Set(['runner', 'blocker', 'kicker']));
    expect(spawnWave(7, BOSS_MILESTONE_WAVE).filter((item) => item.kind === 'boss')).toHaveLength(1);
    expect(spawnWave(7, BOSS_MILESTONE_WAVE - 1).some((item) => item.kind === 'boss')).toBe(false);
  });

  it('escalates to next melee wave deterministically', () => {
    const cleared = state({ wave: 1, enemies: [] });
    const a = updateGame(cleared, idle, 16, 55);
    const b = updateGame(cleared, idle, 16, 55);
    expect(a.wave).toBe(2);
    expect(a.enemies).toEqual(b.enemies);
    expect(a.enemies).toEqual(b.enemies);
    expect(a).not.toHaveProperty('pickups');
    expect(a).not.toHaveProperty('projectiles');
  });
});

describe('Stick Man Running lives', () => {
  it('reaches game over after five separate enemy hits', () => {
    let next = state({ enemies: [enemy({ x: 480 })] });
    for (let hit = 0; hit < 5; hit += 1) {
      next = updateGame(next, idle, 16, 17);
      if (!next.gameOver) {
        next = updateGame(next, idle, PLAYER_INVULNERABILITY_MS, 17);
      }
    }
    expect(next.lives).toBe(0);
    expect(next.gameOver).toBe(true);
    expect(updateGame(next, { ...idle, right: true }, 100, 17)).toBe(next);
  });
});
