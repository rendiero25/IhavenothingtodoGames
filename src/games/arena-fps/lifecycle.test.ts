import { describe, expect, it } from 'vitest';
import { EngineLifecycle } from './lifecycle';
import { createArenaScene } from './scene';

describe('EngineLifecycle', () => {
  it('destroy membatalkan frame dan semua cleanup sekali', () => {
    const calls: string[] = [];
    const life = new EngineLifecycle(
      () => 7,
      () => calls.push('cancel'),
    );
    life.track(() => calls.push('listener'));
    life.start(() => undefined);

    life.destroy();
    life.destroy();

    expect(calls).toEqual(['cancel', 'listener']);
  });
});

describe('createArenaScene', () => {
  it('membuat arena seeded beserta collider dan renderer responsif', () => {
    const calls: string[] = [];
    const renderer = {
      shadowMap: { enabled: false },
      setPixelRatio: (ratio: number) => calls.push(`pixel:${ratio}`),
      setSize: (width: number, height: number) => calls.push(`size:${width}x${height}`),
    };

    const arena = createArenaScene(renderer as never, 17);
    arena.resize(900, 600, 1.5);

    expect(arena.spawnPlayer.toArray()).toEqual([0, 1.7, 14]);
    expect(arena.arenaColliders.length).toBeGreaterThanOrEqual(12);
    expect(arena.arenaColliders.length).toBeLessThanOrEqual(18);
    expect(arena.enemyRoot.parent).toBe(arena.scene);
    expect(arena.projectileRoot.parent).toBe(arena.scene);
    expect(calls).toEqual(['pixel:1.5', 'size:900x600']);
  });

  it('membuang shadow directional light sekali saat arena dihentikan', () => {
    const renderer = {
      shadowMap: { enabled: false },
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const arena = createArenaScene(renderer as never, 17);
    const directional = arena.scene.children.find((child) => child.type === 'DirectionalLight') as unknown as {
      shadow: { dispose(): void };
    };
    let disposals = 0;
    directional.shadow.dispose = () => { disposals += 1; };

    arena.dispose();
    arena.dispose();

    expect(disposals).toBe(1);
  });
});
