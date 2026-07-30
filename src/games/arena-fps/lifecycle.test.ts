import { describe, expect, it } from 'vitest';
import { ContextRecoveryGate } from './engine';
import { EngineLifecycle } from './lifecycle';
import { createArenaScene, selectMotionProfile, selectRenderQuality } from './scene';

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

  it('mengizinkan tepat satu percobaan recovery context', () => {
    const recovery = new ContextRecoveryGate();

    expect(recovery.begin()).toBe('restore');
    expect(recovery.begin()).toBe('fatal');
  });
});

describe('createArenaScene', () => {
  it('memilih low-power sebelum renderer dan membatasi DPR menurut perangkat', () => {
    expect(selectRenderQuality(4, 1, false)).toEqual({ lowPower: true, maxPixelRatio: 2 });
    expect(selectRenderQuality(8, 3, false)).toEqual({ lowPower: true, maxPixelRatio: 2 });
    expect(selectRenderQuality(8, 2, true)).toEqual({ lowPower: false, maxPixelRatio: 1.5 });
  });

  it('reduced motion menghapus shake, memotong recoil 75%, dan memendekkan flash', () => {
    expect(selectMotionProfile(true)).toEqual({ shake: 0, recoil: 0.25, muzzleFlashMs: 35 });
    expect(selectMotionProfile(false)).toEqual({ shake: 1, recoil: 1, muzzleFlashMs: 90 });
  });

  it('low-power mematikan shadow, memendekkan fog, dan memakai cap DPR mobile', () => {
    const calls: string[] = [];
    const renderer = {
      shadowMap: { enabled: true },
      setPixelRatio: (ratio: number) => calls.push(`pixel:${ratio}`),
      setSize: () => undefined,
    };
    const arena = createArenaScene(renderer as never, 17);

    arena.setQuality({ lowPower: true, maxPixelRatio: 1.5 });
    arena.resize(800, 450, 3);

    expect(renderer.shadowMap.enabled).toBe(false);
    expect((arena.scene.fog as { far: number }).far).toBe(52);
    expect(calls).toEqual(['pixel:1.5']);
  });

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
