import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTownScene } from './scene';
import type { TownSettings } from './simulation';

const renderer = vi.hoisted(() => ({ render: vi.fn(), dispose: vi.fn(), disconnect: vi.fn() }));
vi.mock('three', async (importOriginal) => ({
  ...await importOriginal<typeof import('three')>(),
  WebGLRenderer: class {
    shadowMap = { enabled: false, type: 0, autoUpdate: true, needsUpdate: false };
    info = { render: { calls: 0, triangles: 0 } };
    setPixelRatio() {} setSize() {}
    render = renderer.render; dispose = renderer.dispose;
  },
}));

class Surface extends EventTarget {
  clientWidth = 1440; clientHeight = 844;
  style = { touchAction: 'pan-y' }; dataset: Record<string, string> = {};
  captures = new Set<number>();
  closest() { return null; }
  focus() {}
  setPointerCapture(id: number) { this.captures.add(id); }
  hasPointerCapture(id: number) { return this.captures.has(id); }
  releasePointerCapture(id: number) { this.captures.delete(id); }
}
const initial: TownSettings = { weather: 'clear', disaster: 'none', season: 'summer', climate: 'temperate', hour: 14, playing: false, speed: 1 };
let surface: Surface, win: EventTarget, doc: EventTarget & { hidden: boolean }, motion: EventTarget & { matches: boolean };
let callback: FrameRequestCallback, now: number;
const cleanups: Array<() => void> = [];
const event = (target: EventTarget, type: string, props: Record<string, unknown> = {}) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), props));
function setup(settings = initial) {
  const scene = createTownScene(surface as unknown as HTMLCanvasElement, settings);
  cleanups.push(scene.destroy);
  return scene;
}
function frames(count: number) { for (let i = 0; i < count; i++) { now += 50; callback(now); } }
beforeEach(() => {
  vi.clearAllMocks(); now = 0; surface = new Surface(); win = new EventTarget();
  doc = Object.assign(new EventTarget(), { hidden: false }); motion = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('HTMLElement', Surface);
  vi.stubGlobal('window', Object.assign(win, { devicePixelRatio: 1, matchMedia: () => motion }));
  vi.stubGlobal('document', doc);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = renderer.disconnect; });
  vi.stubGlobal('requestAnimationFrame', (next: FrameRequestCallback) => { callback = next; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});
afterEach(() => { cleanups.splice(0).forEach(fn => fn()); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('city runtime controls and lifecycle', () => {
  it('continues rendering, traffic and pedestrian activity with time paused', () => {
    const scene = setup(); frames(20);
    expect(scene.getStats().elapsed).toBeCloseTo(1);
    expect(scene.getStats().traffic).toBeGreaterThan(0);
    expect(scene.getStats().clockPlaying).toBe(false);
    expect(renderer.render.mock.calls.length).toBeGreaterThan(20);
  });
  it('can orbit through a complete revolution without hitting an azimuth limit', () => {
    const scene = setup(), before = scene.getStats().azimuth;
    scene.rotateCamera(Math.PI, 0);
    expect(scene.getStats().azimuth).toBeCloseTo(before + Math.PI);
    scene.rotateCamera(Math.PI, 0);
    expect(scene.getStats().azimuth).toBeCloseTo(before);
  });
  it('left mouse drag rotates freely and releases pointer capture', () => {
    const scene = setup();
    event(surface, 'pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 });
    event(surface, 'pointermove', { pointerId: 1, clientX: 600, clientY: 0 });
    expect(scene.getStats().azimuth).toBeGreaterThan(2);
    event(surface, 'pointerup', { pointerId: 1 }); expect(surface.captures.size).toBe(0);
  });
  it('WASD and held touch buttons move relative to heading, blur stops movement', () => {
    const scene = setup(), before = scene.getStats().focus;
    event(win, 'keydown', { key: 'w' }); frames(10); event(win, 'keyup', { key: 'w' });
    expect(scene.getStats().focus.z).toBeLessThan(before.z);
    scene.setTravelKey('d', true); frames(5); event(win, 'blur');
    const stopped = scene.getStats().focus; frames(5); expect(scene.getStats().focus).toEqual(stopped);
  });
  it('two-finger pinch zooms and pans without losing the remaining pointer', () => {
    const scene = setup();
    event(surface, 'pointerdown', { pointerId: 1, pointerType: 'touch', button: 0, clientX: 100, clientY: 100 });
    event(surface, 'pointerdown', { pointerId: 2, pointerType: 'touch', button: 0, clientX: 200, clientY: 100 });
    event(surface, 'pointermove', { pointerId: 2, clientX: 250, clientY: 100 });
    expect(scene.getStats().zoom).toBeCloseTo(1.5);
    expect(scene.getStats().focus.x).not.toBe(0);
    event(surface, 'pointercancel', { pointerId: 2 }); expect(surface.captures.has(1)).toBe(true);
  });
  it('pauses while hidden or context is lost, and resumes without a large time jump', () => {
    const scene = setup(); frames(10); const before = scene.getStats().elapsed;
    doc.hidden = true; event(doc, 'visibilitychange'); frames(10); expect(scene.getStats().elapsed).toBe(before);
    doc.hidden = false; event(doc, 'visibilitychange'); frames(1); expect(scene.getStats().elapsed).toBeCloseTo(before + .05);
    event(surface, 'webglcontextlost'); frames(10); const lost = scene.getStats().elapsed;
    event(surface, 'webglcontextrestored'); frames(1); expect(scene.getStats().elapsed).toBeCloseTo(lost + .05);
  });
  it('preserves event progress when the hour changes, resets on a new disaster', () => {
    const scene = setup(); scene.updateSettings({ ...initial, disaster: 'flood' }); scene.seekEvent(24);
    scene.updateSettings({ ...initial, hour: 1, disaster: 'flood' }); expect(scene.getStats().eventAge).toBe(24);
    scene.updateSettings({ ...initial, disaster: 'tsunami' }); expect(scene.getStats().eventAge).toBe(0);
  });
  it('reduced motion disables automatic animation while camera buttons remain usable', () => {
    motion.matches = true; const scene = setup(); frames(20);
    expect(scene.getStats().elapsed).toBe(0); scene.moveCamera(1, 0); expect(scene.getStats().focus.z).toBeLessThan(7);
    scene.rotateCamera(2, 0); expect(scene.getStats().azimuth).toBeCloseTo(2.55);
  });
  it('accumulates disaster impacts, retains them when clearing the event, and repairs explicitly', () => {
    const scene = setup(); scene.updateSettings({ ...initial, disaster: 'earthquake' }); scene.seekEvent(4);
    expect(scene.getStats().debris).toBeGreaterThan(0);
    scene.seekEvent(90); expect(scene.getStats().brokenWindows).toBeGreaterThan(0);
    scene.updateSettings(initial); expect(scene.getStats().damage.earthquake).toBe(1);
    scene.updateSettings({ ...initial, disaster: 'wildfire' }); scene.seekEvent(24);
    expect(scene.getStats().damage.earthquake).toBe(1); expect(scene.getStats().damage.wildfire).toBe(1);
    scene.repairCity(); expect(scene.getStats().damage).toEqual({}); expect(scene.getStats().debris).toBe(0);
    frames(5); expect(scene.getStats().damage).toEqual({});
  });
  it('destroy removes listeners, animation, captures and renderer resources once', () => {
    const scene = setup();
    event(surface, 'pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 });
    scene.destroy(); scene.destroy(); const calls = renderer.render.mock.calls.length;
    event(surface, 'pointermove', { pointerId: 1, clientX: 600, clientY: 0 }); frames(10);
    expect(renderer.render.mock.calls.length).toBe(calls); expect(surface.captures.size).toBe(0);
    expect(surface.style.touchAction).toBe('pan-y'); expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.disconnect).toHaveBeenCalledTimes(1);
  });
});
