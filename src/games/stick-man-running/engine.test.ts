import { describe, expect, it } from 'vitest';
import { EngineFrameLoop, EngineResources, handleCanvasPunch } from './engine';

describe('handleCanvasPunch', () => {
  it('touch canvas tidak memicu punch atau preventDefault', () => {
    let punches = 0;
    let prevented = false;

    handleCanvasPunch(
      { button: 0, pointerType: 'touch', preventDefault: () => { prevented = true; } },
      true,
      () => { punches += 1; },
    );

    expect(punches).toBe(0);
    expect(prevented).toBe(false);
  });

  it('klik kiri mouse memicu tepat satu punch', () => {
    let punches = 0;
    let prevented = false;

    handleCanvasPunch(
      { button: 0, pointerType: 'mouse', preventDefault: () => { prevented = true; } },
      true,
      () => { punches += 1; },
    );

    expect(punches).toBe(1);
    expect(prevented).toBe(true);
  });
});

describe('EngineFrameLoop', () => {
  it('pause membatalkan frame aktif dan resume tidak menghitung waktu jeda', () => {
    let nextId = 0;
    const frames = new Map<number, (time: number) => void>();
    const cancelled: number[] = [];
    const deltas: number[] = [];
    const loop = new EngineFrameLoop(
      (callback) => {
        nextId += 1;
        frames.set(nextId, callback);
        return nextId;
      },
      (frameId) => {
        cancelled.push(frameId);
        frames.delete(frameId);
      },
    );

    loop.start((dtMs) => deltas.push(dtMs));
    frames.get(1)?.(100);
    frames.get(2)?.(116);
    loop.pause();
    loop.start((dtMs) => deltas.push(dtMs));
    frames.get(4)?.(5_000);

    expect(deltas).toEqual([0, 16, 0]);
    expect(cancelled).toEqual([3]);
    expect(loop.isRunning).toBe(true);
  });

  it('destroy menghentikan loop secara idempoten dan mencegah restart', () => {
    let requests = 0;
    let cancellations = 0;
    const loop = new EngineFrameLoop(
      () => ++requests,
      () => { cancellations += 1; },
    );

    loop.start(() => undefined);
    loop.destroy();
    loop.destroy();
    loop.start(() => undefined);

    expect(requests).toBe(1);
    expect(cancellations).toBe(1);
    expect(loop.isRunning).toBe(false);
  });
});

describe('EngineResources', () => {
  it('destroy melepas listener dan node milik engine tepat sekali', () => {
    const target = new EventTarget();
    const resources = new EngineResources();
    let events = 0;
    let removals = 0;
    const listener = (): void => { events += 1; };
    const node = { remove: (): void => { removals += 1; } };

    resources.listen(target, 'input', listener);
    resources.ownNode(node);
    target.dispatchEvent(new Event('input'));
    resources.destroy();
    resources.destroy();
    target.dispatchEvent(new Event('input'));

    expect(events).toBe(1);
    expect(removals).toBe(1);
  });

  it('resource yang didaftarkan setelah destroy langsung dibersihkan', () => {
    const resources = new EngineResources();
    let cleanups = 0;
    resources.destroy();

    resources.track(() => { cleanups += 1; });
    resources.ownNode({ remove: () => { cleanups += 1; } });

    expect(cleanups).toBe(2);
  });
});
