import { afterEach, expect, it, vi } from 'vitest';
import { RacingEngine } from './engine';

afterEach(() => vi.unstubAllGlobals());

it('runs each mode, pauses input, and removes controls and frames on destroy', () => {
  for (const mode of ['highway', 'rally', 'slipstream'] as const) {
    let frame: FrameRequestCallback = () => {};
    const cancel = vi.fn();
    const windowTarget = Object.assign(new EventTarget(), { devicePixelRatio: 1, matchMedia: () => ({ matches: true }) });
    vi.stubGlobal('window', windowTarget);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const removed = vi.fn();
    const element = () => ({ className: '', style: {}, setAttribute() {}, append() {}, insertBefore() {}, remove: removed });
    vi.stubGlobal('document', { createElement: element });
    const context = new Proxy({}, { get: () => () => {}, set: () => true });
    const parent = { append: vi.fn() };
    const canvas = Object.assign(new EventTarget(), { parentElement: parent, getContext: () => context,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 375, height: 562.5 }) });
    const callbacks = { onScore: vi.fn(), onLifeLost: vi.fn(), onGameOver: vi.fn() };
    const engine = new RacingEngine(mode);
    engine.init(canvas as unknown as HTMLCanvasElement, { seed: 42, locale: 'id', startLives: 100, roundMs: 15000, callbacks });
    engine.start();
    let now = performance.now();
    for (let i = 0; i < 350; i++) { now += 50; frame(now); }
    expect(callbacks.onGameOver).toHaveBeenCalledOnce();
    expect(callbacks.onGameOver.mock.calls[0][0].endReason).toBe('timeup');
    expect(callbacks.onGameOver.mock.calls[0][0].stats.distance).toBeGreaterThan(1000);
    engine.pause(); engine.destroy();
    expect(parent.append).toHaveBeenCalledOnce();
    expect(removed).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalled();
  }
});
