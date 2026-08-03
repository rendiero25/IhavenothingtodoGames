import { describe, expect, it } from 'vitest';
import type { EnemySpawn, FpsState } from './config';
import { FpsEngine } from './engine';
import { createFpsState, registerHit } from './logic';

describe('FpsEngine damage callbacks', () => {
  it('publishes the combo reset once when accepted damage is followed by invulnerable damage', () => {
    const scoreUpdates: Array<[number, number]> = [];
    let lifeLosses = 0;
    const engine = new FpsEngine() as unknown as {
      state: FpsState;
      elapsed: number;
      opts: { callbacks: { onScore(score: number, combo: number): void; onLifeLost(): void } };
      takeDamage(): void;
    };
    engine.state = registerHit(createFpsState(3), false, true, 50);
    engine.elapsed = 1_000;
    engine.opts = {
      callbacks: {
        onScore: (score, combo) => scoreUpdates.push([score, combo]),
        onLifeLost: () => {
          lifeLosses += 1;
        },
      },
    };

    engine.takeDamage();
    engine.takeDamage();

    expect(engine.state.lives).toBe(2);
    expect(scoreUpdates).toEqual([[50, 0]]);
    expect(lifeLosses).toBe(1);
  });
});

describe('FpsEngine enemy pooling', () => {
  it('does not reuse a drone silhouette for a runner', () => {
    const drone: EnemySpawn = { id: 'drone-1', kind: 'drone', x: 0, z: 0, yaw: 0, health: 40, boss: false };
    const runner: EnemySpawn = { id: 'runner-1', kind: 'runner', x: 1, z: 1, yaw: 0, health: 40, boss: false };
    const engine = new FpsEngine() as unknown as {
      takeEnemyObject(spawn: EnemySpawn): import('three').Group;
      retireEnemy(enemy: { spawn: EnemySpawn; object: import('three').Group }): void;
    };

    const droneObject = engine.takeEnemyObject(drone);
    engine.retireEnemy({ spawn: drone, object: droneObject });
    const runnerObject = engine.takeEnemyObject(runner);

    expect(runnerObject.children.map((child) => (child as import('three').Mesh).geometry.type)).toEqual([
      'ConeGeometry',
      'SphereGeometry',
    ]);
  });
});
