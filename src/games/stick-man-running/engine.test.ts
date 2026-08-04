import { describe, expect, it } from 'vitest';
import { EngineFrameLoop, EngineResources, handleCanvasPunch, StickManRunningEngine } from './engine';

type Listener = EventListenerOrEventListenerObject;

class RecordedTarget {
  private readonly listeners = new Map<string, Set<Listener>>();
  additions = 0;
  removals = 0;

  addEventListener(type: string, listener: Listener): void {
    const entries = this.listeners.get(type) ?? new Set<Listener>();
    entries.add(listener);
    this.listeners.set(type, entries);
    this.additions += 1;
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
    this.removals += 1;
  }

  get activeListeners(): number {
    return [...this.listeners.values()].reduce((total, entries) => total + entries.size, 0);
  }
}

class StubElement extends RecordedTarget {
  readonly dataset: Record<string, string> = {};
  readonly style: Record<string, string> = {};
  readonly children: StubElement[] = [];
  hidden = false;
  type = '';
  textContent: string | null = null;
  removed = false;
  attributes = new Map<string, string>();

  append(child: StubElement): void {
    this.children.push(child);
  }

  remove(): void {
    this.removed = true;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

class StubDocument extends RecordedTarget {
  hidden = false;
  readonly created: StubElement[] = [];

  createElement(_tagName: string): StubElement {
    const element = new StubElement();
    this.created.push(element);
    return element;
  }
}

class StubMediaQuery extends RecordedTarget {
  constructor(readonly matches: boolean) {
    super();
  }
}

function installEngineDomStubs(): {
  canvas: RecordedTarget & { width: number; height: number; parentElement: StubElement; getContext: () => CanvasRenderingContext2D };
  parent: StubElement;
  windowTarget: RecordedTarget & { devicePixelRatio: number };
  documentTarget: StubDocument;
  queries: StubMediaQuery[];
  cancelledFrames: number[];
  restore(): void;
} {
  const globalKeys = ['window', 'document', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'] as const;
  const originalDescriptors = new Map(globalKeys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const setGlobal = (key: typeof globalKeys[number], value: unknown): void => {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  const context = new Proxy({}, {
    get: () => () => undefined,
    set: () => true,
  }) as CanvasRenderingContext2D;
  const parent = new StubElement();
  const canvas = Object.assign(new RecordedTarget(), {
    width: 0,
    height: 0,
    parentElement: parent,
    getContext: () => context,
  });
  const windowTarget = Object.assign(new RecordedTarget(), { devicePixelRatio: 1 });
  const documentTarget = new StubDocument();
  const queries: StubMediaQuery[] = [];
  const frames = new Map<number, FrameRequestCallback>();
  const cancelledFrames: number[] = [];
  let nextFrame = 0;

  setGlobal('window', windowTarget);
  setGlobal('document', documentTarget);
  setGlobal('matchMedia', () => {
    const query = new StubMediaQuery(queries.length === 1);
    queries.push(query);
    return query;
  });
  setGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    nextFrame += 1;
    frames.set(nextFrame, callback);
    return nextFrame;
  });
  setGlobal('cancelAnimationFrame', (frameId: number) => {
    cancelledFrames.push(frameId);
    frames.delete(frameId);
  });

  return {
    canvas,
    parent,
    windowTarget,
    documentTarget,
    queries,
    cancelledFrames,
    restore: () => {
      for (const key of globalKeys) {
        const descriptor = originalDescriptors.get(key);
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

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

  it('mengabaikan callback frame lama setelah pause', () => {
    let nextId = 0;
    const frames = new Map<number, (time: number) => void>();
    const loop = new EngineFrameLoop(
      (callback) => {
        nextId += 1;
        frames.set(nextId, callback);
        return nextId;
      },
      () => undefined,
    );
    const deltas: number[] = [];

    loop.start((dtMs) => deltas.push(dtMs));
    const staleFrame = frames.get(1);
    loop.pause();
    staleFrame?.(500);

    expect(deltas).toEqual([]);
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

describe('StickManRunningEngine lifecycle', () => {
  it('membuat kontrol sentuh dan melepas node, listener, serta RAF saat destroy', () => {
    const dom = installEngineDomStubs();
    try {
      const engine = new StickManRunningEngine();
      engine.init(dom.canvas as unknown as HTMLCanvasElement, {
        seed: 42,
        locale: 'en',
        startLives: 5,
        callbacks: {
          onScore: () => undefined,
          onLifeLost: () => undefined,
          onGameOver: () => undefined,
        },
      });
      engine.start();

      const controls = dom.parent.children.find((child) => child.dataset.stickManControls === 'true');
      expect(controls).toBeDefined();
      expect(controls?.children).toHaveLength(4);
      expect(dom.windowTarget.activeListeners).toBeGreaterThan(0);
      expect(dom.documentTarget.activeListeners).toBe(1);
      expect(dom.canvas.activeListeners).toBe(1);
      expect(dom.queries).toHaveLength(2);
      expect(dom.queries.every((query) => query.activeListeners === 1)).toBe(true);
      expect(controls?.children.every((button) => button.activeListeners === 5)).toBe(true);

      engine.destroy();

      expect(controls?.removed).toBe(true);
      expect(dom.windowTarget.activeListeners).toBe(0);
      expect(dom.documentTarget.activeListeners).toBe(0);
      expect(dom.canvas.activeListeners).toBe(0);
      expect(dom.queries.every((query) => query.activeListeners === 0)).toBe(true);
      expect(controls?.children.every((button) => button.activeListeners === 0)).toBe(true);
      expect(dom.cancelledFrames).toHaveLength(1);
    } finally {
      dom.restore();
    }
  });
});
