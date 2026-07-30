import { describe, expect, it } from 'vitest';
import { FpsEngine, planContextRestore } from './engine';
import { EngineLifecycle, WebGlContextRecovery } from './lifecycle';
import { createArenaScene, selectMotionProfile, selectRenderQuality } from './scene';

describe('EngineLifecycle', () => {
  it('default scheduler memanggil browser frame API dengan receiver global', () => {
    const originalRequestFrame = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
    const originalCancelFrame = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
    let requests = 0;

    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: function (this: typeof globalThis, _callback: FrameRequestCallback): number {
        if (this !== globalThis) throw new TypeError('Illegal invocation');
        requests += 1;
        return 1;
      },
    });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: function (this: typeof globalThis, _frameId: number): void {
        if (this !== globalThis) throw new TypeError('Illegal invocation');
      },
    });

    try {
      const life = new EngineLifecycle();

      life.start(() => undefined);

      expect(requests).toBe(1);
    } finally {
      if (originalRequestFrame) {
        Object.defineProperty(globalThis, 'requestAnimationFrame', originalRequestFrame);
      } else {
        Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
      }
      if (originalCancelFrame) {
        Object.defineProperty(globalThis, 'cancelAnimationFrame', originalCancelFrame);
      } else {
        Reflect.deleteProperty(globalThis, 'cancelAnimationFrame');
      }
    }
  });

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

  it('context loss pertama prevent default, pause, restore, lalu resume', () => {
    const target = new EventTarget();
    const calls: string[] = [];
    const recovery = new WebGlContextRecovery(target, {
      pause: () => {
        calls.push('pause');
        return true;
      },
      restore: () => calls.push('restore'),
      resume: () => calls.push('resume'),
      fatal: () => calls.push('fatal'),
    });
    recovery.attach();
    const loss = new Event('webglcontextlost', { cancelable: true });

    target.dispatchEvent(loss);
    target.dispatchEvent(new Event('webglcontextrestored'));

    expect(loss.defaultPrevented).toBe(true);
    expect(calls).toEqual(['pause', 'restore', 'resume']);
  });

  it('restoration failure memanggil fatal tanpa resume', () => {
    const target = new EventTarget();
    const calls: string[] = [];
    const recovery = new WebGlContextRecovery(target, {
      pause: () => true,
      restore: () => {
        calls.push('restore');
        throw new Error('restore failed');
      },
      resume: () => calls.push('resume'),
      fatal: (error) => calls.push(error.message),
    });
    recovery.attach();

    target.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    target.dispatchEvent(new Event('webglcontextrestored'));

    expect(calls).toEqual(['restore', 'WEBGL_CONTEXT_LOST']);
  });

  it('context loss kedua memanggil fatal', () => {
    const target = new EventTarget();
    const calls: string[] = [];
    const recovery = new WebGlContextRecovery(target, {
      pause: () => false,
      restore: () => undefined,
      resume: () => calls.push('resume'),
      fatal: (error) => calls.push(error.message),
    });
    recovery.attach();

    target.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    target.dispatchEvent(new Event('webglcontextrestored'));
    target.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));

    expect(calls).toEqual(['WEBGL_CONTEXT_LOST']);
  });

  it('cleanup mencegah context event menjalankan callback', () => {
    const target = new EventTarget();
    const calls: string[] = [];
    const recovery = new WebGlContextRecovery(target, {
      pause: () => {
        calls.push('pause');
        return true;
      },
      restore: () => calls.push('restore'),
      resume: () => calls.push('resume'),
      fatal: () => calls.push('fatal'),
    });
    recovery.attach();
    recovery.destroy();

    target.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    target.dispatchEvent(new Event('webglcontextrestored'));

    expect(calls).toEqual([]);
  });

  it('FpsEngine.destroy melepas listener context sebelum memaksa context loss', () => {
    const calls: string[] = [];
    class RecordingTarget extends EventTarget {
      override removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
      ): void {
        calls.push(`remove:${type}`);
        super.removeEventListener(type, callback, options);
      }
    }
    const target = new RecordingTarget();
    const recovery = new WebGlContextRecovery(target, {
      pause: () => false,
      restore: () => undefined,
      resume: () => undefined,
      fatal: () => undefined,
    });
    recovery.attach();
    const engine = new FpsEngine();
    Object.assign(engine as unknown as Record<string, unknown>, {
      contextRecovery: recovery,
      renderer: {
        dispose: () => calls.push('renderer:dispose'),
        forceContextLoss: () => calls.push('renderer:forceContextLoss'),
      },
    });

    engine.destroy();

    expect(calls).toEqual([
      'remove:webglcontextlost',
      'remove:webglcontextrestored',
      'renderer:dispose',
      'renderer:forceContextLoss',
    ]);
  });

  it('memulihkan wave aktif tetapi mempertahankan jeda antar-wave kosong', () => {
    expect(planContextRestore(4, 3, null)).toEqual({ wave: 4, respawnWave: true });
    expect(planContextRestore(4, 0, 8200)).toEqual({ wave: 4, respawnWave: false });
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
